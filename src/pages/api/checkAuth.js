import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!JWT_SECRET) {
    console.error('Missing JWT_SECRET');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await clientPromise;
    const db = client.db('stock_verse');
    const users = db.collection('users');

    const user = await users.findOne(
      { email: decoded.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        email: user.email,
        profilename: user.profilename,
        business: user.business,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('checkAuth error:', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
}
