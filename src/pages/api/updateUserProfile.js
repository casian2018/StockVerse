import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
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

        const { email, profilename, business, phone } = req.body;

        const updatedUser = await users.findOneAndUpdate(
            { email: decoded.email },
            { $set: { email, profilename, business, phone } },
            { returnOriginal: false }
        );

        if (!updatedUser.value) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser.value);
    } catch (error) {
        console.error('Error updating user data:', error.message);
        res.status(500).json({ error: 'An error occurred while updating user data' });
    }
}