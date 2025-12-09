import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "./mongodb";

const JWT_SECRET = process.env.JWT_SECRET;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

interface UserDoc {
  email: string;
  profilename?: string;
  role?: string;
  business?: string;
}

interface CommentDoc {
  business: string;
  taskId: string;
  body: string;
  mentions: string[];
  author: {
    email: string;
    profilename?: string;
    role?: string;
  };
  createdAt: string;
}

function extractMentions(body: string) {
  return Array.from(
    new Set(
      (body.match(/@([A-Za-z0-9._-]+)/g) || []).map((tag) => tag.slice(1))
    )
  );
}

async function postWebhook(message: string) {
  const payload = {
    text: message,
  };
  await Promise.all(
    [SLACK_WEBHOOK_URL, TEAMS_WEBHOOK_URL]
      .filter(Boolean)
      .map((url) =>
        fetch(url as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => null)
      )
  );
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
    const commentsCol = db.collection<CommentDoc>("task_comments");

    const me = await usersCol.findOne({ email: decoded.email });
    if (!me || !me.business) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.method === "GET") {
      const taskId = req.query.taskId as string;
      if (!taskId) {
        return res.status(400).json({ error: "Missing taskId" });
      }
      const docs = await commentsCol
        .find({ business: me.business, taskId })
        .sort({ createdAt: 1 })
        .limit(200)
        .toArray();
      return res.status(200).json(docs);
    }

    if (req.method === "POST") {
      const { taskId, body } = req.body as { taskId?: string; body?: string };
      if (!taskId || !body?.trim()) {
        return res.status(400).json({ error: "Invalid payload" });
      }
      const comment: CommentDoc = {
        business: me.business,
        taskId,
        body: body.trim(),
        mentions: extractMentions(body),
        author: {
          email: me.email,
          profilename: me.profilename,
          role: me.role,
        },
        createdAt: new Date().toISOString(),
      };
      const result = await commentsCol.insertOne(comment);
      const saved = { _id: result.insertedId.toString(), ...comment };
      if (comment.mentions.length > 0) {
        const mentionList = comment.mentions.map((m) => `@${m}`).join(", ");
        const message = `💬 ${me.profilename || me.email} mentioned ${mentionList} on task ${taskId}: ${comment.body}`;
        postWebhook(message);
      }
      return res.status(201).json(saved);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Task comments API error:", error);
    return res.status(500).json({ error: "Unable to load comments" });
  }
}
