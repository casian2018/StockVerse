import type { NextApiRequest, NextApiResponse } from "next";
import type { OrderRecord } from "@/lib/orders";
import { ensureObjectId, serializeOrder } from "@/server/orderUtils";
import { requireUser } from "@/server/apiUser";
import {
  capturePayPalOrder,
  getPayPalAccessToken,
} from "@/lib/paypal";

type ApiResponse = { order: OrderRecord } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { user, db } = await requireUser(req);
    const { orderId, paypalOrderId } = req.body as {
      orderId?: string;
      paypalOrderId?: string;
    };

    if (!orderId || !paypalOrderId) {
      return res
        .status(400)
        .json({ error: "Missing order id or PayPal reference" });
    }

    const objectId = ensureObjectId(orderId);
    const orders = db.collection<OrderRecord>("orders");
    const order = await orders.findOne({ _id: objectId as any });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const businessKey = user.business || user.email || null;
    if (order.business !== businessKey) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isOwner = order.createdBy === user.email;
    if (!isOwner && user.role !== "Admin") {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (order.pendingPayPalOrderId !== paypalOrderId) {
      return res
        .status(400)
        .json({ error: "This payment session is no longer valid." });
    }

    const accessToken = await getPayPalAccessToken();
    const capture = await capturePayPalOrder(accessToken, paypalOrderId);

    if (capture?.status !== "COMPLETED") {
      return res
        .status(400)
        .json({ error: "PayPal could not complete the payment." });
    }

    const now = new Date().toISOString();
    const result: any = await orders.findOneAndUpdate(
      { _id: objectId as any },
      {
        $set: {
          status: "paid",
          paymentStatus: "paid",
          paypalOrderId,
          pendingPayPalOrderId: null,
          paidAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );

    return res.status(200).json({ order: serializeOrder(result.value!) });
  } catch (error) {
    console.error("orders/pay/capture error", error);
    const message =
      error instanceof Error ? error.message : "Unable to confirm payment";
    return res.status(500).json({ error: message });
  }
}
