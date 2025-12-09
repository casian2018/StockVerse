import type { NextApiRequest, NextApiResponse } from "next";
import type { OrderRecord } from "@/lib/orders";
import {
  clipText,
  generateOrderNumber,
  normalizeColors,
  sanitizeIncomingFiles,
  serializeOrder,
} from "@/server/orderUtils";
import { requireUser } from "@/server/apiUser";

type ApiResponse =
  | { orders: OrderRecord[] }
  | { order: OrderRecord }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method === "GET") {
      return await handleList(req, res);
    }
    if (req.method === "POST") {
      return await handleCreate(req, res);
    }
    res.setHeader("Allow", ["GET", "POST"]);
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

async function handleList(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { user, db } = await requireUser(req);
  const businessKey = user.business || user.email || null;
  const ordersCollection = db.collection<OrderRecord>("orders");
  const query =
    user.role === "Admin"
      ? { business: businessKey }
      : { business: businessKey, createdBy: user.email };

  const docs = await ordersCollection
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return res.status(200).json({
    orders: docs.map((doc) => serializeOrder(doc)),
  });
}

async function handleCreate(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { user, db } = await requireUser(req);
  const {
    title,
    usage,
    description,
    colorMode,
    colors,
    details,
    attachments,
  } = req.body as Record<string, unknown>;

  const safeTitle = clipText(title, 120);
  if (!safeTitle || safeTitle.length < 3) {
    return res
      .status(400)
      .json({ error: "Give this order a descriptive title (3+ chars)." });
  }

  const safeDescription = clipText(description ?? details, 600);
  if (!safeDescription) {
    return res
      .status(400)
      .json({ error: "Add a sentence describing what you need." });
  }

  const safeUsage =
    typeof usage === "string" && usage.trim()
      ? clipText(usage, 60)
      : "Other";

  const safeDetails =
    typeof details === "string" && details.trim()
      ? clipText(details, 4000)
      : safeDescription;

  const mode = colorMode === "mono" ? "mono" : "color";
  const palette = normalizeColors(mode, colors);

  const now = new Date().toISOString();
  const uploads = sanitizeIncomingFiles(attachments, {
    now,
    uploadedBy: user.email,
  });

  if (uploads.length === 0) {
    return res
      .status(400)
      .json({ error: "Attach at least one reference file." });
  }

  const businessKey = user.business || user.email || null;

  const orderDoc: Omit<OrderRecord, "_id"> = {
    orderNumber: generateOrderNumber(),
    business: businessKey,
    createdBy: user.email,
    createdByName: user.profilename || user.email,
    title: safeTitle,
    usage: safeUsage,
    description: safeDescription,
    colorMode: mode,
    colors: palette,
    details: safeDetails,
    attachments: uploads,
    proofs: [],
    status: "submitted",
    clientDecision: "pending",
    paymentStatus: "blocked",
    quoteAmount: null,
    paymentLink: null,
    clientNotes: null,
    adminNotes: null,
    clientConfirmedAt: null,
    adminConfirmedAt: null,
    paidAt: null,
    paypalOrderId: null,
    pendingPayPalOrderId: null,
    createdAt: now,
    updatedAt: now,
  };

  const ordersCollection = db.collection<OrderRecord>("orders");
  const { insertedId } = await ordersCollection.insertOne(orderDoc);

  return res.status(201).json({
    order: serializeOrder({
      ...orderDoc,
      _id: insertedId,
    }),
  });
}
