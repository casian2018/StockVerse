import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('stock_verse');
  const users = db.collection('users');

  if (req.method === 'GET') {
    try {
      const token = req.cookies.token; // Get token from cookies
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify and decode token to get user info
      const decoded = jwt.verify(token, JWT_SECRET);
      const loggedInUser = await users.findOne(
        { email: decoded.email },
        { projection: { password: 0 } }
      );

      if (!loggedInUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check role and filter tasks based on business
      if (loggedInUser.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const allTasks = await users.aggregate([
        { $match: { business: loggedInUser.business } },
        { $unwind: '$tasks' },
        { $replaceRoot: { newRoot: '$tasks' } }
      ]).toArray();

      // Check if all subtasks are completed and mark the task as completed or not
      const updatedTasks = allTasks.map((task) => {
        if (task.subtasks && task.subtasks.every((subtask) => subtask.completed)) {
          task.completed = true;
        } else {
          task.completed = false;
        }
        return task;
      });

      res.status(200).json(updatedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching tasks' });
    }
  } else if (req.method === 'POST') {
    try {
      const newTask = req.body;
      await users.updateOne(
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
      const updateResult = await users.updateOne(
        { _id: userId, 'tasks._id': taskId },
        { $set: { 'tasks.$': updatedTask } }
      );
      if (updateResult.modifiedCount === 0) {
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
      const deleteResult = await users.updateOne(
        { _id: userId },
        { $pull: { tasks: { _id: taskId } } }
      );
      if (deleteResult.modifiedCount === 0) {
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
