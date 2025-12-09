import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";
import { Automation } from "@/lib/automations";

const JWT_SECRET = process.env.JWT_SECRET;

async function getCurrentUser(req: NextApiRequest) {
  if (!JWT_SECRET) {
    throw new Error("JWT secret missing");
  }
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
    const ctx = await getCurrentUser(req);
    if (!ctx || !ctx.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { user, db } = ctx;
    // Check business plan for automations availability (Pro+)
    const usersCol = db.collection('users');
    const ownerDoc = await usersCol.findOne({ business: user.business, role: 'Admin' }, { projection: { subscription: 1 } });
    const ownerPlanId = ownerDoc?.subscription?.planId || user.subscription?.planId || 'basic';
    const automationsAllowed = ownerPlanId === 'pro' || ownerPlanId === 'enterprise';
    if (!automationsAllowed) {
      return res.status(403).json({ error: 'Automations are available on Pro and Enterprise plans.' });
    }
    const automations = db.collection("automations");

    if (req.method === "GET") {
      const query =
        user.role === "Admin"
          ? { business: user.business }
          : {
              business: user.business,
              visibilityRoles: { $in: [user.role] },
              active: true,
            };
      const rawItems = await automations
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      const items = rawItems.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
      })) as Automation[];
      return res.status(200).json(items);
    }

    if (req.method === "POST") {
      if (user.role !== "Admin") {
        return res.status(403).json({ error: "Admins only" });
      }
      const payload = req.body as Partial<Automation>;
      if (!payload.name || !payload.trigger || !payload.action) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const now = new Date().toISOString();
      const doc: Automation = {
        business: user.business,
        name: payload.name,
        description: payload.description,
        trigger: payload.trigger,
        action: payload.action,
        visibilityRoles: payload.visibilityRoles || ["Admin"],
        ownerEmail: user.email,
        active: payload.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      const result = await automations.insertOne(doc);
      return res
        .status(201)
        .json({ ...doc, _id: result.insertedId.toString() });
    }

    if (req.method === "PUT") {
      if (user.role !== "Admin") {
        return res.status(403).json({ error: "Admins only" });
      }
      const { id, ...updates } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing automation id" });
      }
      await automations.updateOne(
        { _id: new ObjectId(id), business: user.business },
        { $set: { ...updates, updatedAt: new Date().toISOString() } }
      );
      return res.status(200).json({ message: "Updated" });
    }

    if (req.method === "DELETE") {
      if (user.role !== "Admin") {
        return res.status(403).json({ error: "Admins only" });
      }
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing automation id" });
      }
      await automations.deleteOne({
        _id: new ObjectId(id),
        business: user.business,
      });
      return res.status(200).json({ message: "Deleted" });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Automation API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
