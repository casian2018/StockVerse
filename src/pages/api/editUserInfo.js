import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

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

    // Extract fields from the request body
    const { legalname, email, role, phone, salary, startDate, age } = req.body;

    // Ensure all required fields are provided
    if (!legalname || !email || !role || !phone || salary === undefined || !startDate || age === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Make sure salary and age are valid numbers
    if (isNaN(salary) || isNaN(age)) {
        return res.status(400).json({ error: 'Salary and age must be numbers' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Connect to the database
        const client = await clientPromise;
        const db = client.db('stock_verse');
        const usersCollection = db.collection('users');

        // Find the user document by email (decoded.email)
        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the personal entry by email
        const personalIndex = user.personal.findIndex(person => person.email === email);

        if (personalIndex === -1) {
            return res.status(404).json({ error: 'Personal data not found' });
        }

        // Update the personal item in the array
        user.personal[personalIndex] = {
            ...user.personal[personalIndex], // Keep the old fields
            legalname, 
            role, 
            phone, 
            salary, 
            startDate, 
            age
        };

        // Save the updated user document
        const result = await usersCollection.updateOne(
            { email: decoded.email },
            { $set: { personal: user.personal } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: 'Failed to update personal data' });
        }

        res.status(200).json({ message: 'Personal data updated successfully' });
    } catch (error) {
        console.error('Error updating personal data:', error);
        res.status(500).json({ error: 'An error occurred while updating personal data' });
    }
}