import clientPromise from "./mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const token = req.cookies.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { taskId, updatedTask, subtaskId, subtaskStatus, newSubtask } = req.body;

    if (!taskId || (!updatedTask && !subtaskId && !newSubtask)) {
        return res.status(400).json({ error: "Invalid data provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const client = await clientPromise;
        const db = client.db("stock_verse");

        const user = await db.collection("users").findOne({ email: decoded.email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const taskIndex = user.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });

        if (subtaskId && subtaskStatus !== undefined) {
            // Update Subtask Status
            const subtaskIndex = user.tasks[taskIndex].subtasks.findIndex((sub) => sub.id === subtaskId);
            if (subtaskIndex === -1) return res.status(404).json({ error: "Subtask not found" });

            user.tasks[taskIndex].subtasks[subtaskIndex].completed = subtaskStatus;
        } else if (newSubtask) {
            // Add New Subtask
            const newSubtaskObject = {
                id: Date.now().toString(), // Generate unique ID
                title: newSubtask,
                completed: false,
            };

            if (!user.tasks[taskIndex].subtasks) {
                user.tasks[taskIndex].subtasks = [];
            }

            user.tasks[taskIndex].subtasks.push(newSubtaskObject);
        } else {
            // Full Task Update
            user.tasks[taskIndex] = { 
                ...user.tasks[taskIndex], 
                ...updatedTask, 
                subtasks: updatedTask.subtasks || user.tasks[taskIndex].subtasks 
            };
        }

        await db.collection("users").updateOne(
            { email: decoded.email },
            { $set: { tasks: user.tasks } }
        );

        res.status(200).json({ success: true, tasks: user.tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}