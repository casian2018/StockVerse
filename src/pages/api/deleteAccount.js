import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
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

        const { id } = req.body;

        const result = await users.deleteOne({ _id: new ObjectId(id), business: user.business });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Account not found or not authorized to delete' });
        }

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error.message);
        res.status(500).json({ error: 'An error occurred while deleting the account' });
    }
}