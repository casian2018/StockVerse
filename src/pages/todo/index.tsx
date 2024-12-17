import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  deadline: string;
  completed: boolean;
  subtasks: Subtask[];
}

interface Personal {
  legalname: string;
  email: string;
  role: string;
  phone: string;
  salary: number;
  startDate: string;
  age: number;
}

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignees: [] as string[],
    deadline: "",
    subtasks: [] as Subtask[],
  });
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSubtasks, setShowSubtasks] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const toggleSubtasks = (taskId: string) => {
    setShowSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const getUserInfo = async () => {
    try {
      const response = await fetch("/api/getUserInfo");
      if (!response.ok) throw new Error("Failed to fetch user info");
      const data = await response.json();
      setUser(data);
    } catch {
      setError("Failed to fetch user info");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/checkAuth");
        if (!response.ok) throw new Error("Not authenticated");
        const userData = await response.json();
        setUser(userData);
      } catch {
        setError("You need to log in.");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(data);
      } catch {
        setError("Failed to fetch tasks");
      }
    };

    const fetchPersonal = async () => {
      try {
        const response = await fetch("/api/getUserInfo");
        if (!response.ok) throw new Error("Failed to fetch personal data");
        const data = await response.json();
        setPersonal(data.personal || []);
      } catch {
        setError("Failed to fetch personal data");
      }
    };

    fetchTasks();
    fetchPersonal();
    getUserInfo();
  }, []);

  const addTask = async () => {
    try {
      const response = await fetch("/api/addTasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) throw new Error();
      const newTaskWithId = {
        ...newTask,
        id: Date.now().toString(),
        completed: false,
      };
      setTasks((prev) => (prev ? [...prev, newTaskWithId] : [newTaskWithId]));
      setNewTask({
        title: "",
        description: "",
        assignees: [],
        deadline: "",
        subtasks: [],
      });
    } catch {
      setError("Failed to add task");
    }
  };

  const addSubtaskToNewTask = () => {
    const newSubtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle,
      completed: false,
    };
    setNewTask((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubtask],
    }));
    setNewSubtaskTitle("");
  };

  

  const addSubtask = async (taskId: string, newSubtask: string) => {
    try {
        const updatedTasks = tasks.map((task) => {
            if (task.id === taskId) {
                const newSubtaskObject = {
                    id: Date.now().toString(), // Unique ID for frontend state
                    title: newSubtask,
                    completed: false,
                };
                return {
                    ...task,
                    subtasks: [...(task.subtasks || []), newSubtaskObject],
                };
            }
            return task;
        });
        setTasks(updatedTasks);

        // Send the new subtask to the API
        await fetch("/api/updateTasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskId,
                newSubtask,
            }),
        });
    } catch (error) {
        console.error("Failed to add subtask:", error);
        setError("Failed to add subtask");
    }
};


  const updateSubtaskStatus = async (
    taskId: string,
    subtaskId: string,
    completed: boolean
  ) => {
    try {
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed } : subtask
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      setTasks(updatedTasks);

      await fetch("/api/updateTasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          subtaskId,
          subtaskStatus: completed,
        }),
      });
    } catch {
      setError("Failed to update subtask status");
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  const todoTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="font-inter text-gray-800 flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="w-full md:w-[calc(100%-256px)] md:ml-64 bg-white p-8">
        <h1 className="text-3xl font-bold mb-8">To-Do List</h1>

        {user?.role === "Admin" && (
          <section className="mb-12">
            <div className="bg-white border-4 rounded-lg shadow relative m-10">
              <div className="flex items-start justify-between p-5 border-b rounded-t">
                <h3 className="text-xl font-semibold">Add New Task</h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTask();
                  }}
                >
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="task-title"
                        className="text-sm font-medium text-gray-900 block mb-2"
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        id="task-title"
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask({ ...newTask, title: e.target.value })
                        }
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        required
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="task-description"
                        className="text-sm font-medium text-gray-900 block mb-2"
                      >
                        Description
                      </label>
                      <input
                        type="text"
                        id="task-description"
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            description: e.target.value,
                          })
                        }
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        required
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="task-deadline"
                        className="text-sm font-medium text-gray-900 block mb-2"
                      >
                        Deadline
                      </label>
                      <input
                        type="date"
                        id="task-deadline"
                        value={newTask.deadline}
                        onChange={(e) =>
                          setNewTask({ ...newTask, deadline: e.target.value })
                        }
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        required
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="task-assignees"
                        className="text-sm font-medium text-gray-900 block mb-2"
                      >
                        Assignees
                      </label>
                      <select
                        multiple
                        id="task-assignees"
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
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        required
                      >
                        {personal.map((person) => (
                          <option key={person.email} value={person.legalname}>
                            {person.legalname}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-6">
                      <label
                        htmlFor="task-subtasks"
                        className="text-sm font-medium text-gray-900 block mb-2"
                      >
                        Subtasks
                      </label>
                      <div className="space-y-2">
                        {newTask.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center">
                            <input
                              type="text"
                              value={subtask.title}
                              readOnly
                              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                            />
                          </div>
                        ))}
                        <div className="flex items-center">
                          <input
                            type="text"
                            id="task-subtasks"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                            placeholder="New Subtask"
                          />
                          <button
                            type="button"
                            onClick={addSubtaskToNewTask}
                            className="ml-2 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                          >
                            Add Subtask
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-200 rounded-b">
                <button
                  onClick={addTask}
                  className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  type="submit"
                >
                  Add Task
                </button>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-4">To-Do Tasks</h2>
          {todoTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todoTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-2">{task.description}</p>
                  <p className="text-gray-600 mb-2">
                    Assignees: {task.assignees.join(", ")}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Deadline: {task.deadline}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Completed: {task.completed ? "Yes" : "No"}
                  </p>
                  <button
                    onClick={() => toggleSubtasks(task.id)}
                    className="text-blue-500 underline mb-2"
                  >
                    {showSubtasks[task.id] ? "Hide Subtasks" : "Show Subtasks"}
                  </button>
                  {showSubtasks[task.id] && (
                    <ul className="mt-2">
                      {task.subtasks.length > 0 ? (
                        task.subtasks.map((subtask) => (
                          <li
                            key={subtask.id}
                            className="flex justify-between items-center"
                          >
                            {subtask.title} -{" "}
                            {subtask.completed ? "Completed" : "Pending"}
                            <button
                              onClick={() =>
                                updateSubtaskStatus(
                                  task.id,
                                  subtask.id,
                                  !subtask.completed
                                )
                              }
                              className="ml-4 px-2 py-1 bg-blue-500 text-white rounded-md my-1"
                            >
                              {subtask.completed
                                ? "Mark as Uncompleted"
                                : "Mark as Completed"}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li>No subtasks</li>
                      )}
                      {user?.role === "Admin" && (
                        <li>
                          <input
                            type="text"
                            placeholder="New Subtask"
                            className="border p-2 rounded-md"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addSubtask(
                                  task.id,
                                  (e.target as HTMLInputElement).value
                                );
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                        </li>
                      )}

                      {user?.role === "Manager" && (
                        <li>
                          <input
                            type="text"
                            placeholder="New Subtask"
                            className="border p-2 rounded-md"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addSubtask(
                                  task.id,
                                  (e.target as HTMLInputElement).value
                                );
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No tasks available.</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold my-4">Completed Tasks</h2>
          {completedTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-2">{task.description}</p>
                  <p className="text-gray-600 mb-2">
                    Assignees: {task.assignees.join(", ")}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Deadline: {task.deadline}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Completed: {task.completed ? "Yes" : "No"}
                  </p>
                  <button
                    onClick={() => toggleSubtasks(task.id)}
                    className="text-blue-500 underline mb-2"
                  >
                    {showSubtasks[task.id] ? "Hide Subtasks" : "Show Subtasks"}
                  </button>
                  {showSubtasks[task.id] && (
                    <ul className="mt-2">
                      {task.subtasks.length > 0 ? (
                        task.subtasks.map((subtask) => (
                          <li
                            key={subtask.id}
                            className="flex justify-between items-center"
                          >
                            {subtask.title} -{" "}
                            {subtask.completed ? "Completed" : "Pending"}
                            <button
                              onClick={() =>
                                updateSubtaskStatus(
                                  task.id,
                                  subtask.id,
                                  !subtask.completed
                                )
                              }
                              className="ml-4 px-2 py-1 bg-blue-500 text-white rounded-md"
                            >
                              {subtask.completed
                                ? "Mark as Uncompleted"
                                : "Mark as Completed"}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li>No subtasks</li>
                      )}
                      {user?.role === "Admin" && (
                        <li>
                          <input
                            type="text"
                            placeholder="New Subtask"
                            className="border p-2 rounded-md"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addSubtask(
                                  task.id,
                                  (e.target as HTMLInputElement).value
                                );
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No completed tasks available.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
