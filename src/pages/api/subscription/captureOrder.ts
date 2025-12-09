import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import {
  subscriptionPlanMap,
  SubscriptionPlanId,
  SubscriptionRecord,
} from "@/lib/subscriptionPlans";
import {
  capturePayPalOrder,
  getPayPalAccessToken,
} from "@/lib/paypal";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { orderId, planId } = req.body as {
    orderId?: string;
    planId?: SubscriptionPlanId;
  };

  if (!orderId || !planId || !subscriptionPlanMap[planId]) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    const client = await clientPromise;
    const db = client.db("stock_verse");
    const users = db.collection("users");
    const user = await users.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = await getPayPalAccessToken();
    const capture = await capturePayPalOrder(accessToken, orderId);

    if (capture?.status !== "COMPLETED") {
      return res
        .status(400)
        .json({ error: "PayPal capture did not complete", capture });
    }

    const nowIso = new Date().toISOString();
    const existing: SubscriptionRecord | undefined = user.subscription;

    const subscription: SubscriptionRecord = {
      ...existing,
      planId,
      status: "active",
      paypalOrderId: orderId,
      lastPaidAt: nowIso,
      updatedAt: nowIso,
      activeSince: existing?.activeSince || nowIso,
      trialEndsAt: existing?.trialEndsAt,
      trialStartedAt: existing?.trialStartedAt,
      trialUsed: true,
    };

    await users.updateOne(
      { email: decoded.email },
      { $set: { subscription } }
    );

    return res.status(200).json({ subscription });
  } catch (error) {
    console.error("captureOrder error:", error);
    return res.status(500).json({ error: "Unable to capture PayPal order" });
  }
}
