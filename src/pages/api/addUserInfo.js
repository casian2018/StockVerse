import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { legalname, email, role, phone, password, business } = req.body;

    if (!legalname || !email || !role || !phone || !password || !business) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        await client.connect();
        const database = client.db("stock_verse");
        const collection = database.collection("users");

        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const newUser = {
            legalname,
            email,
            role,
            phone,
            password, 
            business,
            createdAt: new Date(),
        };

        await collection.insertOne(newUser);

        res.status(201).json({ message: "User added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await client.close();
    }
}