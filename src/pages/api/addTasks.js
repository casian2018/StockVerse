import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { title, description, assignees, deadline, subtasks } = req.body;

    // Check if all required fields are provided
    if (!title || !description || !assignees || !deadline || !subtasks) {
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

        // Create the new task object
        const newTask = { title, description, assignees, deadline, subtasks, completed: false };

        // Update the user's document to add the new task to their tasks array
        const updateResult = await usersCollection.updateOne(
            { email: decoded.email },
            { $push: { tasks: newTask } }
        );

        // Check if the task was successfully added
        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to add task' });
        }

        // Return a success response with the newly added task
        res.status(201).json({ message: 'Task added successfully', task: newTask });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}