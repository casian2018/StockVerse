import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Missing JWT secret" });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const client = await clientPromise;
    const db = client.db("stock_verse");
    const usersCol = db.collection("users");
    const profilesCol = db.collection("business_profiles");

    const me = await usersCol.findOne({ email: decoded.email });
    if (!me || !me.business) {
      return res.status(404).json({ error: "User/business not found" });
    }

    if (req.method === "GET") {
      const profile = await profilesCol.findOne(
        { business: me.business },
        { projection: { _id: 0 } }
      );
      return res.status(200).json(
        profile || {
          business: me.business,
          industry: null,
          focusAreas: [],
          country: null,
          currency: null,
          locale: null,
          updatedAt: null,
        }
      );
    }

    if (req.method === "PUT") {
      if (me.role !== "Admin") {
        return res.status(403).json({ error: "Admins only" });
      }
      const { industry, focusAreas, country, currency, locale } = req.body as {
        industry?: string;
        focusAreas?: string[];
        country?: string;
        currency?: string;
        locale?: string;
      };
      if (!industry) {
        return res.status(400).json({ error: "Industry is required" });
      }
      const payload = {
        business: me.business,
        industry,
        focusAreas: Array.isArray(focusAreas) ? focusAreas.slice(0, 5) : [],
        country: country || null,
        currency: currency || null,
        locale: locale || null,
        updatedAt: new Date().toISOString(),
        updatedBy: me.email,
      };
      await profilesCol.updateOne(
        { business: me.business },
        { $set: payload },
        { upsert: true }
      );
      return res.status(200).json(payload);
    }

    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Business profile API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
