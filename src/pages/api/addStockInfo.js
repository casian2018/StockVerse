import clientPromise from "./mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { productName, price, location, dateOfPurchase, quantity } = req.body;

    if (!productName || !price || !location || !dateOfPurchase || !quantity) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const client = await clientPromise;
        const db = client.db("yourDatabaseName");
        const collection = db.collection("stocks");

        const existingStock = await collection.findOne({ productName });
        if (existingStock) {
            return res.status(409).json({ message: "Stock with this product name already exists" });
        }

        const newStock = { productName, price, location, dateOfPurchase, quantity };
        await collection.insertOne(newStock);

        res.status(201).json({ message: "Stock added successfully", stock: newStock });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}