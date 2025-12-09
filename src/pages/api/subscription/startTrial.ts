import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import {
  subscriptionPlanMap,
  SubscriptionPlanId,
  TRIAL_LENGTH_DAYS,
  SubscriptionRecord,
} from "@/lib/subscriptionPlans";

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

    const client = await clientPromise;
    const db = client.db("stock_verse");
    const users = db.collection("users");

    const user = await users.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing: SubscriptionRecord | undefined = user.subscription;
    const now = new Date();

    if (existing?.status === "active") {
      return res
        .status(400)
        .json({ error: "An active subscription already exists" });
    }

    if (existing?.trialUsed) {
      return res
        .status(400)
        .json({ error: "Trial already redeemed for this account" });
    }

    const trialEndsAt = new Date(
      now.getTime() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const subscription: SubscriptionRecord = {
      planId,
      status: "trial",
      trialStartedAt: now.toISOString(),
      trialEndsAt,
      trialUsed: true,
      updatedAt: now.toISOString(),
    };

    await users.updateOne(
      { email: decoded.email },
      { $set: { subscription } }
    );

    return res.status(200).json({ subscription });
  } catch (error) {
    console.error("startTrial error:", error);
    return res.status(500).json({ error: "Unable to start trial" });
  }
}
