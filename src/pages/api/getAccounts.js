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
        const users = db.collection('users');

        const user = await users.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const accounts = await users.find({ business: user.business }, { projection: { password: 0 } }).toArray();

        res.status(200).json(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching accounts' });
    }
}