import clientPromise from './mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('stock_verse');
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is missing.");
      throw new Error("JWT_SECRET is not defined in the environment variables");
    }

    // Generate the JWT token
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Set the token in an HTTP-only cookie
    const cookieOptions = [
      `HttpOnly`,
      `Path=/`,
      `Max-Age=3600`, // 1 hour
      `SameSite=Strict`
    ];

    // Add the Secure flag only in production
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push(`Secure`);
    }

    // Set the cookie with the options and token
    res.setHeader('Set-Cookie', `token=${token}; ${cookieOptions.join('; ')}`);
    
    res.status(200).json({
      message: 'Login successful',
      user: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    });

  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: 'An error occurred while logging in' });
  }
}
