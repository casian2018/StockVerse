import type { NextApiRequest, NextApiResponse } from "next";
import type { OrderRecord } from "@/lib/orders";
import {
  MAX_PROOF_COUNT,
  clipText,
  ensureObjectId,
  sanitizeIncomingFiles,
  serializeOrder,
} from "@/server/orderUtils";
import { requireUser } from "@/server/apiUser";

type ApiResponse = { order: OrderRecord } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method === "PUT") {
      return await handleUpdate(req, res);
    }
    if (req.method === "DELETE") {
      return await handleCancel(req, res);
    }
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as any).statusCode) || 500
        : 500;
    const message =
      error instanceof Error ? error.message : "Unable to process request";
    return res.status(status).json({ error: message });
  }
}

async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { user, db } = await requireUser(req);
  const orderId = ensureObjectId(req.query.orderId as string);
  const orders = db.collection<OrderRecord>("orders");
  const order = await orders.findOne({ _id: orderId as any });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const businessKey = user.business || user.email || null;
  if (order.business !== businessKey) {
    return res.status(404).json({ error: "Order not found" });
  }

  const isAdmin = user.role === "Admin";
  const isOwner = order.createdBy === user.email;

  const action = typeof req.body?.action === "string" ? req.body.action : "";
  const note =
    typeof req.body?.note === "string" ? clipText(req.body.note, 2000) : null;
  const now = new Date().toISOString();

  if (!action) {
    return res.status(400).json({ error: "Missing action" });
  }

  switch (action) {
    case "appendProofs": {
      if (!isAdmin) {
        return res.status(403).json({ error: "Admins only" });
      }
      if (order.status === "cancelled") {
        return res
          .status(400)
          .json({ error: "Cancelled orders cannot receive proofs." });
      }
      const files = sanitizeIncomingFiles(req.body.files, {
        maxItems: MAX_PROOF_COUNT,
        now,
        uploadedBy: user.email,
      });
      if (!files.length) {
        return res.status(400).json({ error: "Attach at least one proof." });
      }
      const result: any = await orders.findOneAndUpdate(
        { _id: orderId as any },
        {
          $push: { proofs: { $each: files } },
          $set: {
            status: "proofs_ready",
            adminNotes: note ?? order.adminNotes ?? null,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );
      return res.status(200).json({ order: serializeOrder(result.value!) });
    }

    case "clientDecision": {
      if (!isOwner) {
        return res.status(403).json({ error: "Only the requester can decide." });
      }
      if (order.status !== "proofs_ready") {
        return res
          .status(400)
          .json({ error: "Proofs are not ready for review yet." });
      }
      const decision =
        req.body?.decision === "approved" ? "approved" : "rejected";
      const update: Record<string, unknown> = {
        updatedAt: now,
        clientNotes: note ?? order.clientNotes ?? null,
      };

      if (decision === "approved") {
        update.status = "client_confirmed";
        update.clientDecision = "approved";
        update.clientConfirmedAt = now;
      } else {
        update.status = "client_rejected";
        update.clientDecision = "rejected";
        update.clientConfirmedAt = null;
        update.adminConfirmedAt = null;
        update.paymentStatus = "blocked";
        update.quoteAmount = null;
        update.paymentLink = null;
        update.pendingPayPalOrderId = null;
        update.paypalOrderId = null;
      }

      const result: any = await orders.findOneAndUpdate(
        { _id: orderId as any },
        { $set: update },
        { returnDocument: "after" }
      );
      return res.status(200).json({ order: serializeOrder(result.value!) });
    }

    case "adminConfirm": {
      if (!isAdmin) {
        return res.status(403).json({ error: "Admins only" });
      }
      if (order.clientDecision !== "approved") {
        return res
          .status(400)
          .json({ error: "Wait for the client to approve the proof." });
      }

      const rawAmount =
        typeof req.body?.quoteAmount === "number"
          ? req.body.quoteAmount
          : typeof req.body?.quoteAmount === "string"
          ? Number(req.body.quoteAmount)
          : null;
      const quoteAmount =
        rawAmount !== null && Number.isFinite(rawAmount) && rawAmount > 0
          ? Number(rawAmount.toFixed(2))
          : null;
      const paymentLink =
        typeof req.body?.paymentLink === "string" && req.body.paymentLink.trim()
          ? clipText(req.body.paymentLink.trim(), 400)
          : null;

      const paymentStatus =
        quoteAmount && quoteAmount > 0 ? "ready" : "blocked";

      const result: any = await orders.findOneAndUpdate(
        { _id: orderId as any },
        {
          $set: {
            status: "admin_confirmed",
            adminNotes: note ?? order.adminNotes ?? null,
            adminConfirmedAt: now,
            paymentStatus,
            quoteAmount,
            paymentLink,
            updatedAt: now,
            pendingPayPalOrderId: null,
            paypalOrderId: null,
          },
        },
        { returnDocument: "after" }
      );
      return res.status(200).json({ order: serializeOrder(result.value!) });
    }

    case "markPaid": {
      if (!isAdmin) {
        return res.status(403).json({ error: "Admins only" });
      }
      const result: any = await orders.findOneAndUpdate(
        { _id: orderId as any },
        {
          $set: {
            status: "paid",
            paymentStatus: "paid",
            paidAt: now,
            adminNotes: note ?? order.adminNotes ?? null,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );
      return res.status(200).json({ order: serializeOrder(result.value!) });
    }

    case "cancel": {
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: "Not allowed" });
      }
      const noteField = isAdmin ? "adminNotes" : "clientNotes";
      const result: any = await orders.findOneAndUpdate(
        { _id: orderId as any },
        {
          $set: {
            status: "cancelled",
            clientDecision: "rejected",
            paymentStatus: "blocked",
            clientConfirmedAt: null,
            adminConfirmedAt: null,
            quoteAmount: null,
            paymentLink: null,
            pendingPayPalOrderId: null,
            paypalOrderId: null,
            [noteField]:
              note ?? (order as any)[noteField as keyof OrderRecord] ?? null,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );
      return res.status(200).json({ order: serializeOrder(result.value!) });
    }

    default:
      return res.status(400).json({ error: "Unknown action" });
  }
}

async function handleCancel(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  req.body = { ...(req.body || {}), action: "cancel" };
  return handleUpdate(req, res);
}
