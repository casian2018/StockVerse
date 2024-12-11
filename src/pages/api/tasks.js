import clientPromise from './mongodb';

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db('stock_verse');
    const users = db.collection('users');

    if (req.method === 'GET') {
        try {
            const allTasks = await users.aggregate([
                { $unwind: '$tasks' },
                { $replaceRoot: { newRoot: '$tasks' } }
            ]).toArray();
            res.status(200).json(allTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error.message);
            res.status(500).json({ error: 'An error occurred while fetching tasks' });
        }
    } else if (req.method === 'POST') {
        try {
            const newTask = req.body;
            const result = await users.updateOne(
                { _id: newTask.userId },
                { $push: { tasks: newTask } }
            );
            res.status(201).json(newTask);
        } catch (error) {
            console.error('Error adding task:', error.message);
            res.status(500).json({ error: 'An error occurred while adding the task' });
        }
    } else if (req.method === 'PUT') {
        try {
            const { userId, taskId, updatedTask } = req.body;
            const result = await users.updateOne(
                { _id: userId, 'tasks._id': taskId },
                { $set: { 'tasks.$': updatedTask } }
            );
            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.status(200).json(updatedTask);
        } catch (error) {
            console.error('Error updating task:', error.message);
            res.status(500).json({ error: 'An error occurred while updating the task' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { userId, taskId } = req.body;
            const result = await users.updateOne(
                { _id: userId },
                { $pull: { tasks: { _id: taskId } } }
            );
            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.status(200).json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Error deleting task:', error.message);
            res.status(500).json({ error: 'An error occurred while deleting the task' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
