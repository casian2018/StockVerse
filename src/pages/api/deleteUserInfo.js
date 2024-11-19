import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await clientPromise;
    const db = client.db('stock_verse');
    const users = db.collection('users');

    const result = await users.updateOne(
      { email: decoded.email },
      { $pull: { personal: { email: email } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.status(200).json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error.message);
    res.status(500).json({ error: 'An error occurred while deleting person' });
  }
}
