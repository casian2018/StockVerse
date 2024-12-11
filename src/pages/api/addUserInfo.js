import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { legalname, email, role, phone, salary, startDate, age } = req.body;

    // Check if all required fields are provided
    if (!legalname || !email || !role || !phone || !salary || !startDate || !age) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Verify JWT token to identify the user
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Connect to the MongoDB client
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const usersCollection = db.collection('users');

        // Find the user document by email
        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the personal info already exists in the user's personal array
        const existingPerson = user.personal?.find(person => person.email === email);
        if (existingPerson) {
            return res.status(409).json({ message: 'Person with this email already exists' });
        }

        // Create the new personal info object
        const newPerson = { legalname, email, role, phone, salary, startDate, age };

        // Update the user's document to add the new personal info to their personal array
        const updateResult = await usersCollection.updateOne(
            { email: decoded.email },
            { $push: { personal: newPerson } }
        );

        // Check if the personal info was successfully added
        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to add personal info' });
        }

        // Create a new user document for the new person
        const newUser = {
            email,
            password: '$2a$10$Io9jamYaj7qJpa48Qz.wI.tgjrt3RfFT9FJC0F.BeSCD6q6bxmnsO', // Set an appropriate default password or handle password creation separately
            business: user.business, // Use the main user's business
            phone,
            profilename: legalname,
            role: 'Guest'
        };

        const insertResult = await usersCollection.insertOne(newUser);

        // Check if the new user was successfully added
        if (!insertResult.insertedId) {
            return res.status(500).json({ message: 'Failed to create new user' });
        }

        // Return a success response with the newly added personal info
        res.status(201).json({ message: 'Personal info and new user added successfully', person: newPerson });
    } catch (error) {
        console.error('Error adding personal info and new user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}