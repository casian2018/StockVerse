import clientPromise from "./mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { email, password } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db("stock_verse");
    const users = db.collection("users");

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.updateOne({ email }, { $set: { password: hashedPassword } });

    res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Password setup error:", error);
    res.status(500).json({ error: "Failed to set password" });
  }
}