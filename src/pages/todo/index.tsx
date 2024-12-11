import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface Subtask {
    title: string;
    completed: boolean;
}

interface Task {
    title: string;
    description: string;
    assignees: string[];
    deadline: string;
    subtasks: Subtask[];
    completed: boolean;
}

export default function TodoPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [legalnames, setLegalnames] = useState<string[]>([]);
    const [mainUser, setMainUser] = useState<any>(null);    
    const [newTask, setNewTask] = useState<Task>({
        title: "",
        description: "",
        assignees: [],
        deadline: "",
        subtasks: [],
        completed: false,
    });

    useEffect(() => {
        // Fetch tasks
        const fetchTasks = async () => {
            try {
                const response = await fetch("/api/tasks");
                const data = await response.json();
                setTasks(data);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();
    }, []);

    useEffect(() => {
        // Fetch user personal legalnames
        const fetchUserInfo = async () => {
            try {
                const response = await fetch("/api/getUserInfo");
                const data = await response.json();

                setLegalnames(data.legalnames || []);
                setMainUser(data.mainUser || {});
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        fetchUserInfo();
    }, []);

    const addTask = async () => {
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTask),
            });
            const data = await response.json();
            setTasks([...tasks, data]);
            setNewTask({
                title: "",
                description: "",
                assignees: [],
                deadline: "",
                subtasks: [],
                completed: false,
            });
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const toggleSubtaskCompletion = (taskIndex: number, subtaskIndex: number) => {
        const updatedTasks = [...tasks];
        const subtask = updatedTasks[taskIndex].subtasks[subtaskIndex];
        subtask.completed = !subtask.completed;

        // Check if all subtasks are completed
        const allSubtasksCompleted = updatedTasks[taskIndex].subtasks.every(
            (subtask) => subtask.completed
        );
        updatedTasks[taskIndex].completed = allSubtasksCompleted;

        setTasks(updatedTasks);
    };

    return (
        <div className="font-inter text-gray-800 flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="w-full md:w-[calc(100%-256px)] md:ml-64 bg-white p-8">
                <h1 className="text-3xl font-bold mb-8">Todo List</h1>
                {mainUser?.role === 'Admin' && (
                    <section className="mb-12">
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    addTask();
                                }}
                                className="flex flex-col gap-4"
                            >
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex-1">
                                        Task Title
                                        <input
                                            type="text"
                                            placeholder="Task Title"
                                            value={newTask.title}
                                            onChange={(e) =>
                                                setNewTask({ ...newTask, title: e.target.value })
                                            }
                                            className="w-full border p-2 rounded-md"
                                            required
                                        />
                                    </label>
                                    <label className="flex-1">
                                        Deadline
                                        <input
                                            type="date"
                                            placeholder="Deadline"
                                            value={newTask.deadline}
                                            onChange={(e) =>
                                                setNewTask({ ...newTask, deadline: e.target.value })
                                            }
                                            className="w-full border p-2 rounded-md"
                                            required
                                        />
                                    </label>
                                </div>
                                <label>
                                    Task Description
                                    <textarea
                                        placeholder="Task Description"
                                        value={newTask.description}
                                        onChange={(e) =>
                                            setNewTask({ ...newTask, description: e.target.value })
                                        }
                                        className="w-full border p-2 rounded-md"
                                        required
                                    />
                                </label>
                                <label>
                                    Assignees
                                    <select
                                        multiple
                                        value={newTask.assignees}
                                        onChange={(e) =>
                                            setNewTask({
                                                ...newTask,
                                                assignees: Array.from(
                                                    e.target.selectedOptions,
                                                    (option) => option.value
                                                ),
                                            })
                                        }
                                        className="w-full border p-2 rounded-md"
                                        required
                                    >
                                        {legalnames.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <button
                                    type="submit"
                                    className="self-start px-6 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition"
                                >
                                    Add Task
                                </button>
                            </form>
                        </div>
                    </section>
                )}

                {/* Task List */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Task List</h2>
                    {tasks.length > 0 ? (
                        <ul>
                            {tasks.map((task, index) => (
                                <li key={index} className="mb-2">
                                    <strong>{task.title}</strong>: {task.description} -{" "}
                                    {task.deadline}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No tasks available.</p>
                    )}
                </section>
            </main>
        </div>
    );
}