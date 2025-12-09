import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

type UserDoc = {
  _id: string;
  email: string;
  profilename?: string;
  role?: string;
  business?: string;
  personal?: Array<{ department?: string }>;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    const me = await usersCol.findOne({ email: decoded.email });
    if (!me) {
      return res.status(404).json({ error: "User not found" });
    }

    const requesterDept = extractDepartment(me);

    const colleagues = await usersCol
      .find(
        { business: me.business, email: { $ne: me.email } },
        { projection: { password: 0 } as any }
      )
      .toArray();

    const allowed = colleagues.filter((colleague) =>
      canChat(me, colleague, requesterDept)
    );

    const payload = allowed.map((user) => ({
      email: user.email,
      profilename: user.profilename || user.email,
      role: user.role,
      department: extractDepartment(user),
    }));

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Chat users API error:", error);
    return res.status(500).json({ error: "Failed to load chat users" });
  }
}
