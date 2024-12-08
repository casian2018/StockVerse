import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productName } = req.body;

    if (!productName) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Connect to MongoDB
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const usersCollection = db.collection('users');

        // Find the user by email
        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Use $pull to remove the stock item by productName
        const result = await usersCollection.updateOne(
            { email: decoded.email },
            { $pull: { stocks: { productName } } }
        );

        // If no document was modified, the stock might not exist
        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        res.status(200).json({ message: 'Stock unit deleted successfully' });
    } catch (error) {
        console.error('Error deleting stock data:', error.message);
        res.status(500).json({ error: 'An error occurred while deleting stock data' });
    }
}
