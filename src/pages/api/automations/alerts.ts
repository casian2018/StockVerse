import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

async function getContext(req: NextApiRequest) {
  if (!JWT_SECRET) throw new Error("JWT secret missing");
  const token = req.cookies.token;
  if (!token) return null;
  const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
  const client = await clientPromise;
  const db = client.db("stock_verse");
  const users = db.collection("users");
  const user = await users.findOne({ email: decoded.email });
  return { user, db };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const ctx = await getContext(req);
    if (!ctx || !ctx.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { user, db } = ctx;
    const alertsCol = db.collection("automation_alerts");

    if (req.method === "GET") {
      const includeRead = req.query.includeRead === "true";
      const findQuery: any = {
        business: user.business,
        $or: [{ roles: { $size: 0 } }, { roles: { $in: [user.role] } }],
      };
      if (!includeRead) {
        findQuery.readBy = { $ne: user.email };
      }

      const alertsRaw = await alertsCol
        .find(findQuery)
        .sort({ createdAt: -1 })
        .limit(includeRead ? 100 : 20)
        .toArray();
      const alerts = alertsRaw.map((alert) => ({
        ...alert,
        _id: alert._id.toString(),
        read: Array.isArray(alert.readBy)
          ? alert.readBy.includes(user.email)
          : false,
      }));
      return res.status(200).json(alerts);
    }

    if (req.method === "POST") {
      const { alertId, markAll } = req.body as {
        alertId?: string;
        markAll?: boolean;
      };
      if (!alertId && !markAll) {
        return res.status(400).json({ error: "Missing alert id" });
      }
      if (markAll) {
        await alertsCol.updateMany(
          {
            business: user.business,
            $or: [{ roles: { $size: 0 } }, { roles: { $in: [user.role] } }],
          },
          { $addToSet: { readBy: user.email } }
        );
      } else if (alertId) {
        await alertsCol.updateOne(
          { _id: new ObjectId(alertId) },
          { $addToSet: { readBy: user.email } }
        );
      }
      return res.status(200).json({ message: "Acknowledged" });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Alerts API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
