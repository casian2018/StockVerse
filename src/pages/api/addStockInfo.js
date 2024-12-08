import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { productName, price, location, dateOfPurchase, quantity } = req.body;

    // Check if all required fields are provided
    if (!productName || !price || !location || !dateOfPurchase || !quantity) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Verify JWT token to identify the user
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Connect to the MongoDB client
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const usersCollection = db.collection('users');

        // Find the user document by email
        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the stock already exists in the user's stocks array
        const existingStock = user.stocks.find(stock => stock.productName === productName);
        if (existingStock) {
            return res.status(409).json({ message: 'Stock with this product name already exists' });
        }

        // Create the new stock object
        const newStock = { productName, price, location, dateOfPurchase, quantity };

        // Update the user's document to add the new stock to their stocks array
        const updateResult = await usersCollection.updateOne(
            { email: decoded.email },
            { $push: { stocks: newStock } }
        );

        // Check if the stock was successfully added
        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to add stock' });
        }

        // Return a success response with the newly added stock
        res.status(201).json({ message: 'Stock added successfully', stock: newStock });
    } catch (error) {
        console.error('Error adding stock data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
