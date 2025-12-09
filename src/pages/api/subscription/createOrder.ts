import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import {
  subscriptionPlanMap,
  SubscriptionPlanId,
} from "@/lib/subscriptionPlans";
import {
  createPayPalOrder,
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

  const { planId } = req.body as { planId?: SubscriptionPlanId };
  if (!planId || !subscriptionPlanMap[planId]) {
    return res.status(400).json({ error: "Invalid plan selected" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    // Ensure user exists
    const client = await clientPromise;
    const db = client.db("stock_verse");
    const users = db.collection("users");
    const user = await users.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = subscriptionPlanMap[planId];
    const amount = plan.price.toFixed(2);

    const accessToken = await getPayPalAccessToken();
    const order = await createPayPalOrder(accessToken, {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description: `${plan.name} plan subscription`,
          custom_id: `${planId}:${decoded.email}`,
        },
      ],
    });

    return res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ error: "Unable to create PayPal order" });
  }
}
