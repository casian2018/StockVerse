import clientPromise from "./mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { legalname, email, role, phone } = req.body;

    if (!legalname || !email || !role || !phone) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const client = await clientPromise;
        const db = client.db("yourDatabaseName");
        const collection = db.collection("personal");

        const existingPerson = await collection.findOne({ email });
        if (existingPerson) {
            return res.status(409).json({ message: "Person with this email already exists" });
        }

        const newPerson = { legalname, email, role, phone };
        await collection.insertOne(newPerson);

        res.status(201).json({ message: "Person added successfully", person: newPerson });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}