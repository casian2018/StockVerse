import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const stocks = db.collection('stocks');

        const stockData = await stocks.find({ userEmail: decoded.email }).toArray();

        if (stockData.length === 0) {
            return res.status(404).json({ error: 'No stock data found' });
        }

        res.status(200).json(stockData);
    } catch (error) {
        console.error('Error fetching stock data:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching stock data' });
    }
}