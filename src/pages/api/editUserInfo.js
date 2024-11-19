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

    const { legalname, email, role, phone } = req.body;

    if (!legalname || !email || !role || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const users = db.collection('users');

        const result = await users.updateOne(
            { email: decoded.email, 'personal.email': email },
            { $set: { 'personal.$.legalname': legalname, 'personal.$.role': role, 'personal.$.phone': phone } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        res.status(200).json({ message: 'Person updated successfully' });
    } catch (error) {
        console.error('Error updating personal data:', error);
        res.status(500).json({ error: 'An error occurred while updating personal data' });
    }
}