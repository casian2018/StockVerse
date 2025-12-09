import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "./mongodb";
import type { WithId, Document } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

interface UserDoc extends WithId<Document> {
  email: string;
  business?: string;
  role?: string;
  subscription?: { planId?: string };
}

function extractMentions(content: string) {
  const matches = content.match(/@([A-Za-z0-9._-]+)/g) || [];
  return Array.from(new Set(matches.map((m) => m.replace("@", ""))));
}

async function hasEnterpriseAccess(usersCol: any, user: UserDoc) {
  if (user.subscription?.planId === "enterprise") return true;
  const boss = await usersCol.findOne(
    { business: user.business, role: "Admin" },
    { projection: { subscription: 1 } }
  );
  return boss?.subscription?.planId === "enterprise";
}

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
    const usersCol = db.collection<UserDoc>("users");
    const notesCol = db.collection("workspace_notes");

    const me = await usersCol.findOne({ email: decoded.email });
    if (!me) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!(await hasEnterpriseAccess(usersCol, me))) {
      return res
        .status(403)
        .json({ error: "Enterprise plan required for workspace notes." });
    }

    if (req.method === "GET") {
      const doc = await notesCol.findOne({ business: me.business });
      return res.status(200).json(
        doc || {
          business: me.business,
          content: "",
          mentions: [],
          updatedAt: null,
          updatedBy: null,
        }
      );
    }

    if (req.method === "PUT") {
      const { content } = req.body as { content?: string };
      if (typeof content !== "string") {
        return res.status(400).json({ error: "Invalid content" });
      }
      const mentions = extractMentions(content);
      const payload = {
        business: me.business,
        content,
        mentions,
        updatedAt: new Date().toISOString(),
        updatedBy: me.email,
      };

      await notesCol.updateOne(
        { business: me.business },
        { $set: payload },
        { upsert: true }
      );
      return res.status(200).json(payload);
    }

    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Notes API error:", error);
    return res.status(500).json({ error: "Failed to load notes" });
  }
}
