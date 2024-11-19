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

    const { productName, price, location, dateOfPurchase, quantity } = req.body;

    if (!productName || price === undefined || !location || !dateOfPurchase || quantity === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const stocks = db.collection('stocks');

        const result = await stocks.updateOne(
            { productName, userEmail: decoded.email },
            { $set: { price, location, dateOfPurchase, quantity } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
        console.error('Error updating stock data:', error);
        res.status(500).json({ error: 'An error occurred while updating stock data' });
    }
}