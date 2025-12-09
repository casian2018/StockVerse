import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "./mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

function formatICSDate(dateStr: string) {
  const date = new Date(dateStr);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  if (!JWT_SECRET) {
    return res.status(500).end("Missing JWT secret");
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).end("Unauthorized");
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const client = await clientPromise;
    const db = client.db("stock_verse");
    const users = db.collection("users");

    const me = await users.findOne({ email: decoded.email });
    if (!me) {
      return res.status(404).end("User not found");
    }

    const tasks = await users
      .aggregate([
        { $match: { business: me.business, tasks: { $exists: true } } },
        { $unwind: "$tasks" },
        { $replaceRoot: { newRoot: "$tasks" } },
      ])
      .toArray();

    const dtstamp = formatICSDate(new Date().toISOString());
    const events = tasks
      .map((task: any) => {
        if (!task.deadline) return null;
        const start = formatICSDate(task.deadline);
        const summary = task.title || "Task";
        const description = (task.description || "").replace(/\n/g, "\\n");
        return [
          "BEGIN:VEVENT",
          `UID:${task.id || task._id || Math.random()}@stockverse`,
          `DTSTAMP:${dtstamp}`,
          `DTSTART;VALUE=DATE:${start}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .filter(Boolean)
      .join("\r\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StockVerse//Tasks//EN",
      events,
      "END:VCALENDAR",
    ].join("\r\n");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"stockverse-${me.business || "team"}-tasks.ics\"`
    );
    return res.status(200).send(ics);
  } catch (error) {
    console.error("ICS export error:", error);
    return res.status(500).end("Unable to generate calendar");
  }
}
