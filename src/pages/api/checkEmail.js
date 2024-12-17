import clientPromise from "./mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db("stock_verse");
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (user) {
      return res.status(200).json({
        exists: true,
        hasPassword: !!user.password,
      });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
