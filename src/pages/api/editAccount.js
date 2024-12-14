import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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

    const { _id, email, role } = req.body;

    if (!_id || !email || !role) {
        return res.status(400).json({ error: '_id, email, and role are required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const client = await clientPromise;
        const db = client.db('stock_verse');
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: { email, role } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'No accounts found with the provided id' });
        }

        res.status(200).json({ message: 'Account updated successfully' });
    } catch (error) {
        console.error('Error updating account data:', error);
        res.status(500).json({ error: 'An error occurred while updating account data' });
    }
}