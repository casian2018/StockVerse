import type { NextApiRequest, NextApiResponse } from "next";
import type { OrderRecord } from "@/lib/orders";
import { ensureObjectId } from "@/server/orderUtils";
import { requireUser } from "@/server/apiUser";
import {
  createPayPalOrder,
  getPayPalAccessToken,
} from "@/lib/paypal";

type ApiResponse = { orderId: string } | { error: string };

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
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: "Missing order id" });
    }

    const objectId = ensureObjectId(orderId);
    const orders = db.collection<OrderRecord>("orders");
    const order = await orders.findOne({ _id: objectId });

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

    if (
      order.status !== "admin_confirmed" ||
      order.paymentStatus !== "ready" ||
      !order.quoteAmount ||
      order.quoteAmount <= 0
    ) {
      return res
        .status(400)
        .json({ error: "This order is not ready for payment." });
    }

    const accessToken = await getPayPalAccessToken();
    const paypalOrder = await createPayPalOrder(accessToken, {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: order.quoteAmount.toFixed(2),
          },
          description: `Custom order ${order.orderNumber}`,
          custom_id: order._id?.toString() ?? objectId.toString(),
        },
      ],
    });

    await orders.updateOne(
      { _id: objectId },
      {
        $set: {
          pendingPayPalOrderId: paypalOrder.id,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return res.status(200).json({ orderId: paypalOrder.id });
  } catch (error) {
    console.error("orders/pay/create error", error);
    const message =
      error instanceof Error ? error.message : "Unable to create payment";
    return res.status(500).json({ error: message });
  }
}
