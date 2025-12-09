import clientPromise from './mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    // Verify JWT token to identify the user
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const { email, role, password } = req.body;
    if (!email || !role || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const client = await clientPromise;
    const db = client.db('stock_verse');
    const usersCollection = db.collection('users');

    // Find the user document by email
    const user = await usersCollection.findOne({ email: decoded.email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // If user has no business, cannot create sub-accounts
    if (!user.business) {
        return res.status(400).json({ message: 'Creator has no business associated' });
    }

    // Determine business owner (Admin) to check subscription plan and seat limits
    const ownerDoc = await usersCollection.findOne({ business: user.business, role: 'Admin' });
    const ownerPlanId = ownerDoc?.subscription?.planId || 'basic';

    // Seat limits per plan
    const seatLimits = {
        basic: 5,
        pro: 25,
        enterprise: Infinity,
    };

    const maxSeats = seatLimits[ownerPlanId] ?? 5;

    // Count existing accounts for this business
    const currentCount = await usersCollection.countDocuments({ business: user.business });

    if (currentCount >= maxSeats) {
        return res.status(403).json({ message: `Seat limit reached for plan '${ownerPlanId}'. Upgrade to add more users.` });
    }

    // Check if the account already exists
    const existingAccount = await usersCollection.findOne({ email });
    if (existingAccount) {
        return res.status(409).json({ message: 'Account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
// Create a new user document for the new account
const newUser = {
    email,
    password: hashedPassword,
    business: user.business, // Use the main user's business
    role,
    phone: '', // Default empty phone
    profilename: '', // Default empty profile name
};


    const result = await usersCollection.insertOne(newUser);

    if (!result.acknowledged) {
        return res.status(500).json({ message: 'Failed to create account' });
    }

    return res.status(201).json({ message: 'Account created successfully', user: newUser });
}