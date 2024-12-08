import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract fields from the request body
    const { productName, price, location, dateOfPurchase, quantity } = req.body;

    // Ensure all required fields are provided
    if (!productName || price === undefined || !location || !dateOfPurchase || quantity === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Make sure price and quantity are valid numbers
    if (isNaN(price) || isNaN(quantity)) {
        return res.status(400).json({ error: 'Price and quantity must be numbers' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Connect to the database
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const usersCollection = db.collection('users');

        // Find the user document by email (decoded.email)
        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the stock entry by productName and userEmail
        const stockIndex = user.stocks.findIndex(stock => stock.productName === productName);

        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Update the stock item in the array
        user.stocks[stockIndex] = {
            ...user.stocks[stockIndex], // Keep the old fields
            price, 
            location, 
            dateOfPurchase, 
            quantity
        };

        // Save the updated user document
        const result = await usersCollection.updateOne(
            { email: decoded.email },
            { $set: { stocks: user.stocks } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: 'Failed to update stock' });
        }

        res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
        console.error('Error updating stock data:', error);
        res.status(500).json({ error: 'An error occurred while updating stock data' });
    }
}
