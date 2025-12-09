import type { NextApiRequest } from "next";
import type { Db } from "mongodb";
import jwt from "jsonwebtoken";
import clientPromise from "@/pages/api/mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthContext {
  user: any;
  db: Db;
}

export async function requireUser(req: NextApiRequest): Promise<AuthContext> {
  if (!JWT_SECRET) {
    const error = new Error("Server misconfigured");
    (error as any).statusCode = 500;
    throw error;
  }

  const token = req.cookies?.token;
  if (!token) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = 401;
    throw error;
  }

  let decoded: { email: string };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as { email: string };
  } catch {
    const error = new Error("Unauthorized");
    (error as any).statusCode = 401;
    throw error;
  }

  const client = await clientPromise;
  const db = client.db("stock_verse");
  const users = db.collection("users");
  const user = await users.findOne({ email: decoded.email });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  return { user, db };
}
