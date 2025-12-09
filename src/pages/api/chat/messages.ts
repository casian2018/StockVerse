import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

type UserDoc = {
  _id: ObjectId;
  email: string;
  role?: string;
  business?: string;
  profilename?: string;
  personal?: Array<{ department?: string }>;
};

type MessageDoc = {
  _id?: ObjectId;
  business: string;
  participants: string[];
  senderEmail: string;
  recipientEmail: string;
  body: string;
  createdAt: string;
};

function extractDepartment(user?: UserDoc | null) {
  return user?.personal && user.personal.length > 0
    ? user.personal[0]?.department || null
    : null;
}

function canChat(
  requester: UserDoc,
  target: UserDoc,
  requesterDept: string | null
) {
  if (
    !target ||
    requester.email === target.email ||
    requester.business !== target.business
  )
    return false;
  if (requester.role === "Admin" || target.role === "Admin") return true;
  const targetDept = extractDepartment(target);
  if (!requesterDept || !targetDept) return false;

  if (requester.role === "Manager") {
    return target.role === "Guest" && targetDept === requesterDept;
  }

  if (requester.role === "Guest") {
    return (
      (target.role === "Manager" && targetDept === requesterDept) ||
      target.role === "Admin"
    );
  }

  return false;
}

async function getContext(req: NextApiRequest) {
  if (!JWT_SECRET) throw new Error("Missing JWT secret");
  const token = req.cookies.token;
  if (!token) return null;

  const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
  const client = await clientPromise;
  const db = client.db("stock_verse");
  const usersCol = db.collection<UserDoc>("users");
  const me = await usersCol.findOne({ email: decoded.email });
  if (!me) return null;

  return { db, me, usersCol };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Missing JWT secret" });
  }

  try {
    const ctx = await getContext(req);
    if (!ctx) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { db, me, usersCol } = ctx;
    // Check business plan for chat availability (Pro+)
    const ownerDoc = await usersCol.findOne({ business: me.business, role: 'Admin' }, { projection: { subscription: 1 } });
    const ownerPlanId = ownerDoc?.subscription?.planId || me.subscription?.planId || 'basic';
    const chatAllowed = ownerPlanId === 'pro' || ownerPlanId === 'enterprise';
    if (!chatAllowed) {
      return res.status(403).json({ error: 'Chat is available on Pro and Enterprise plans.' });
    }
    const messagesCol = db.collection<MessageDoc>("messages");
    const requesterDept = extractDepartment(me);

    if (req.method === "GET") {
      const targetEmail = req.query.with as string | undefined;
      if (!targetEmail) {
        return res.status(400).json({ error: "Missing recipient" });
      }

      const target = await usersCol.findOne({
        email: targetEmail,
        business: me.business,
      });
      if (!target || !canChat(me, target, requesterDept)) {
        return res.status(403).json({ error: "Conversation not permitted" });
      }

      const participants = [me.email, targetEmail].sort();
      const docs = await messagesCol
        .find({ business: me.business, participants })
        .sort({ createdAt: 1 })
        .limit(200)
        .toArray();

      const payload = docs.map((doc) => ({
        _id: doc._id?.toString(),
        senderEmail: doc.senderEmail,
        recipientEmail: doc.recipientEmail,
        body: doc.body,
        createdAt: doc.createdAt,
      }));
      return res.status(200).json(payload);
    }

    if (req.method === "POST") {
      const { to, message } = req.body as { to?: string; message?: string };
      if (!to || !message || !message.trim()) {
        return res.status(400).json({ error: "Missing chat payload" });
      }

      const target = await usersCol.findOne({
        email: to,
        business: me.business,
      });
      if (!target || !canChat(me, target, requesterDept)) {
        return res.status(403).json({ error: "Conversation not permitted" });
      }

      const doc: MessageDoc = {
        business: me.business || "",
        participants: [me.email, to].sort(),
        senderEmail: me.email,
        recipientEmail: to,
        body: message.trim(),
        createdAt: new Date().toISOString(),
      };

      const result = await messagesCol.insertOne(doc);
      return res.status(201).json({
        _id: result.insertedId.toString(),
        ...doc,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Chat messages API error:", error);
    return res.status(500).json({ error: "Chat service error" });
  }
}
