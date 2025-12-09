"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
// import { Calendar as CalendarIcon, Plus, AlarmClock, User2, AlertTriangle, Check, MoveRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isBefore,
  isToday,
  formatDistanceToNow,
} from "date-fns";
import { useAuth } from "@/hooks/useAuth";

/** ---------------- TYPES ---------------- */
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Status = "Todo" | "In Progress" | "Completed";

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
  deadline: string; // ISO date
  completed: boolean;
  subtasks: Subtask[];
  status: Status;
  priority: Priority;
  createdAt: string; // ISO
}

interface TaskComment {
  _id?: string;
  taskId: string;
  body: string;
  createdAt: string;
  mentions?: string[];
  author: {
    email: string;
    profilename?: string;
    role?: string;
  };
}

/** ---------------- HELPERS ---------------- */
const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];
const statusColumns: Status[] = ["Todo", "In Progress", "Completed"];

const priorityClasses: Record<Priority, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Urgent: "bg-rose-50 text-rose-700 border-rose-200",
};

function clsx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  const [a = "", b = ""] = name.split(" ");
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}

/** ---------------- PAGE ---------------- */
export default function TodoDashboardAdvanced() {
  const { user, loading: authLoading, error: authError } = useAuth({
    requireSubscription: true,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    assignees: [],
    deadline: format(new Date(), "yyyy-MM-dd"),
    subtasks: [],
    status: "Todo",
    priority: "Medium",
  });
  const [newSubtask, setNewSubtask] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Calendar state
  const [monthDate, setMonthDate] = useState<Date>(new Date());

  /** ---------------- EFFECTS ---------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error();
        const data = await res.json();
        // ensure defaults
        const normalized: Task[] = data.map((t: any) => ({
          priority: "Medium",
          status: "Todo",
          createdAt: new Date().toISOString(),
          ...t,
        }));
        setTasks(normalized);
      } catch {
        // fallback demo if needed (optional)
      } finally {
        setTasksLoading(false);
      }
    };
    loadTasks();
  }, []);

  /** ---------------- FILTERING ---------------- */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const fa =
        filterAssignee === "All" || t.assignees.includes(filterAssignee);
      const fs = filterStatus === "All" || t.status === filterStatus;
      const fp = filterPriority === "All" || t.priority === filterPriority;
      return fa && fs && fp;
    });
  }, [tasks, filterAssignee, filterStatus, filterPriority]);

  const teammateNames = useMemo(
    () =>
      (user?.personal || [])
        .map((p) => p.legalname)
        .filter((name): name is string => Boolean(name)),
    [user?.personal]
  );

  /** ---------------- TOASTS ---------------- */
  const toast = (text: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      2500
    );
  };

  /** ---------------- TASK ACTIONS ---------------- */
  const handleAddTask = async () => {
    if (!newTask.title?.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title!,
      description: newTask.description || "",
      assignees: (newTask.assignees || []) as string[],
      deadline: newTask.deadline || format(new Date(), "yyyy-MM-dd"),
      completed: false,
      subtasks: (newTask.subtasks || []) as Subtask[],
      status: (newTask.status as Status) || "Todo",
      priority: (newTask.priority as Priority) || "Medium",
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, task]);
    setShowModal(false);
    setNewTask({
      title: "",
      description: "",
      assignees: [],
      deadline: format(new Date(), "yyyy-MM-dd"),
      subtasks: [],
      status: "Todo",
      priority: "Medium",
    });
    setNewSubtask("");
    toast("Task created");

    await fetch("/api/addTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  };

  const addSubtaskToNew = () => {
    if (!newSubtask.trim()) return;
    setNewTask((prev) => ({
      ...prev,
      subtasks: [
        ...(prev.subtasks || []),
        { id: Date.now().toString(), title: newSubtask, completed: false },
      ],
    }));
    setNewSubtask("");
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      )
    );
  };

  const moveTaskTo = async (taskId: string, status: Status) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status, completed: status === "Completed" }
          : t
      )
    );
    toast(`Moved to ${status}`);
    await fetch("/api/updateTasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
  };

  const updateDeadline = async (taskId: string, date: Date) => {
    const iso = format(date, "yyyy-MM-dd");
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, deadline: iso } : t))
    );
    toast(`Rescheduled to ${format(date, "MMM d")}`);
    await fetch("/api/updateTasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, deadline: iso }),
    });
  };

  const setPriority = async (taskId: string, p: Priority) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: p } : t))
    );
    await fetch("/api/updateTasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, priority: p }),
    });
  };

  const loadComments = useCallback(async (taskId: string) => {
    try {
      setCommentsLoading(true);
      const res = await fetch(`/api/taskComments?taskId=${taskId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const openComments = (task: Task) => {
    setCommentTask(task);
    setCommentInput("");
    loadComments(task.id);
  };

  const submitComment = async () => {
    if (!commentTask || !commentInput.trim()) return;
    const optimistic: TaskComment = {
      taskId: commentTask.id,
      body: commentInput.trim(),
      createdAt: new Date().toISOString(),
      author: {
        email: user?.email || "me",
        profilename: user?.profilename || user?.email,
        role: user?.role,
      },
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentInput("");
    try {
      const res = await fetch("/api/taskComments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: commentTask.id, body: optimistic.body }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setComments((prev) =>
        prev.map((c) => (c === optimistic ? saved : c))
      );
    } catch {
      toast("Failed to post comment");
      setComments((prev) => prev.filter((c) => c !== optimistic));
    }
  };

  /** ---------------- DND: KANBAN ---------------- */
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/task-id", taskId);
  };
  const onDropColumn = (e: React.DragEvent, status: Status) => {
    const taskId = e.dataTransfer.getData("text/task-id");
    if (taskId) moveTaskTo(taskId, status);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  /** ---------------- DND: CALENDAR ---------------- */
  const onDropDay = (e: React.DragEvent, date: Date) => {
    const taskId = e.dataTransfer.getData("text/task-id");
    if (taskId) updateDeadline(taskId, date);
  };

  /** ---------------- CALENDAR GRID ---------------- */
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [monthDate]);

  /** ---------------- STATS ---------------- */
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Completed").length;
  const todayCount = tasks.filter((t) => isToday(new Date(t.deadline))).length;

  if ((authLoading && !user) || tasksLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600 text-lg">
        Loading tasks…
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500 text-lg">
        {authError}
      </div>
    );
  }

  return (
    <div className="font-inter flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      <Sidebar role={user?.role} />

      <main className="flex-1 md:ml-64 w-full p-4 sm:p-6 md:p-8 pt-24 md:pt-8 relative">
        {/* Animated background blobs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="pointer-events-none absolute top-24 left-10 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="pointer-events-none absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-blue-200 rounded-full blur-3xl opacity-50"
        />

        {/* Header & stats */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Tasks
            </h1>
            <p className="text-gray-500 mt-1">
              Hello {user?.profilename || "there"} —{" "}
              {format(currentTime, "EEE, MMM d • HH:mm")}
            </p>
          </div>

          <div className="flex gap-4">
            <StatCard label="Total" value={total} />
            <StatCard label="Completed" value={done} />
            <StatCard label="Today" value={todayCount} />
          </div>
        </div>

        {/* Filters + actions */}
        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mt-10 w-full"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-lg px-6 py-4">
            {/* Left Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-gray-500 text-sm font-medium">
                  Person
                </label>
                <select
                  className="px-4 py-2 rounded-xl text-sm bg-white/70 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                >
                  <option value="All">All People</option>
                  {user?.personal?.map((p) => (
                    <option key={p.legalname} value={p.legalname}>
                      {p.legalname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-500 text-sm font-medium">
                  Status
                </label>
                <select
                  className="px-4 py-2 rounded-xl text-sm bg-white/70 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Status</option>
                  {statusColumns.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-500 text-sm font-medium">
                  Priority
                </label>
                <select
                  className="px-4 py-2 rounded-xl text-sm bg-white/70 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex flex-wrap gap-3 items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-xl transition-all"
              >
                + Add Task
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCalendarOpen((v) => !v)}
                className="px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-gray-200 text-gray-700 font-medium shadow-sm hover:bg-white hover:text-indigo-600 transition-all"
              >
                {calendarOpen ? "Board View" : "Calendar View"}
              </motion.button>
              <a
                href="/api/calendar.ics"
                className="px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-gray-200 text-gray-700 font-medium shadow-sm hover:bg-white hover:text-indigo-600 transition-all"
              >
                Shared calendar (.ics)
              </a>
            </div>
          </div>

          {/* Optional underline glow */}
          <div className="h-[2px] w-full mt-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 opacity-50 rounded-full"></div>
        </motion.div>

        {/* Calendar OR Board */}
        {calendarOpen ? (
          <div className="relative z-10 mt-8 bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="font-semibold">
                {format(monthDate, "MMMM yyyy")}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                  onClick={() =>
                    setMonthDate(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                    )
                  }
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                  onClick={() => setMonthDate(new Date())}
                >
                  Today
                </button>
                <button
                  className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                  onClick={() =>
                    setMonthDate(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="bg-white/80 p-2 text-xs font-semibold text-gray-500 text-center"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {calendarDays.map((day) => {
                const dayTasks = filteredTasks.filter((t) =>
                  isSameDay(new Date(t.deadline), day)
                );
                const isCurrMonth = day.getMonth() === monthDate.getMonth();
                return (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      "bg-white p-2 min-h-[120px] align-top",
                      isToday(day) && "ring-2 ring-indigo-500 relative",
                      !isCurrMonth && "bg-gray-50"
                    )}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropDay(e, day)}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className={clsx(
                          "font-semibold",
                          !isCurrMonth && "text-gray-400"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                          {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={clsx(
                            "px-2 py-1 rounded-lg text-xs border truncate",
                            priorityClasses[t.priority]
                          )}
                          draggable
                          onDragStart={(e) => onDragStart(e, t.id)}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-gray-500">
                          +{dayTasks.length - 3} more…
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusColumns.map((status) => (
              <div
                key={status}
                className="bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-lg p-4"
                onDragOver={onDragOver}
                onDrop={(e) => onDropColumn(e, status)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{status}</h3>
                  <span className="text-xs text-gray-500">
                    {filteredTasks.filter((t) => t.status === status).length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence initial={false}>
                    {filteredTasks
                      .filter((t) => t.status === status)
                      .map((task) => {
                        const overdue =
                          task.status !== "Completed" &&
                          isBefore(new Date(task.deadline), new Date());

                        const completedCount = task.subtasks.filter(
                          (s) => s.completed
                        ).length;
                        const totalSub = task.subtasks.length || 1;
                        const progress = Math.round(
                          (completedCount / totalSub) * 100
                        );

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                              className="bg-white rounded-xl border border-gray-100 shadow p-4 cursor-grab active:cursor-grabbing"
                              draggable
                              onDragStartCapture={(e) => onDragStart(e, task.id)}
                              >
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{task.title}</h4>
                              <div
                                className={clsx(
                                  "text-[10px] px-2 py-0.5 rounded-full border",
                                  priorityClasses[task.priority]
                                )}
                              >
                                {task.priority}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>

                            <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
                              {/* <AlarmClock className="w-3.5 h-3.5" /> */}
                              <span
                                className={clsx(
                                  overdue && "text-rose-600 font-semibold"
                                )}
                              >
                                {format(new Date(task.deadline), "MMM d, yyyy")}
                                {overdue && " • overdue"}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                              {task.assignees.map((a) => (
                                <span
                                  key={a}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]"
                                  title={a}
                                >
                                  {initials(a)}
                                </span>
                              ))}
                            </div>

                            {task.subtasks.length > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[11px] text-gray-500">
                                  <span>
                                    {completedCount}/{totalSub} subtasks
                                  </span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>

                                <div className="mt-2 space-y-1">
                                  {task.subtasks.map((s) => (
                                    <label
                                      key={s.id}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        className="rounded"
                                        checked={s.completed}
                                        onChange={() =>
                                          toggleSubtask(task.id, s.id)
                                        }
                                      />
                                      <span
                                        className={clsx(
                                          s.completed &&
                                            "line-through text-gray-400"
                                        )}
                                      >
                                        {s.title}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex gap-1">
                                {priorities.map((p) => (
                                  <button
                                    key={p}
                                    onClick={() => setPriority(task.id, p)}
                                    className={clsx(
                                      "w-2.5 h-2.5 rounded-full border",
                                      p === "Low" &&
                                        "bg-emerald-400 border-emerald-400",
                                      p === "Medium" &&
                                        "bg-blue-400 border-blue-400",
                                      p === "High" &&
                                        "bg-amber-400 border-amber-400",
                                      p === "Urgent" &&
                                        "bg-rose-400 border-rose-400",
                                      task.priority === p &&
                                        "ring-2 ring-offset-1 ring-black/10"
                                    )}
                                    title={p}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openComments(task)}
                                  className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
                                >
                                  Comments
                                </button>
                                {status !== "Completed" && (
                                  <button
                                    onClick={() =>
                                      moveTaskTo(
                                        task.id,
                                        status === "Todo"
                                          ? "In Progress"
                                          : "Completed"
                                      )
                                    }
                                    className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                                  >
                                    Move Forward
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL: Add Task */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-gray-100"
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 10, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Create Task</h3>
                  <button
                    className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">
                      Title
                    </label>
                    <input
                      value={newTask.title || ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      placeholder="Task title"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">
                      Description
                    </label>
                    <textarea
                      value={newTask.description || ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      rows={3}
                      placeholder="Describe this task"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={
                        newTask.deadline || format(new Date(), "yyyy-MM-dd")
                      }
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Priority
                    </label>
                    <select
                      value={newTask.priority || "Medium"}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          priority: e.target.value as Priority,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">
                      Assignees
                    </label>
                    <select
                      multiple
                      value={(newTask.assignees as string[]) || []}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          assignees: Array.from(
                            e.target.selectedOptions,
                            (o) => o.value
                          ),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                    >
                      {user?.personal?.map((p) => (
                        <option key={p.legalname} value={p.legalname}>
                          {p.legalname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">
                      Subtasks
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border bg-white"
                        placeholder="Subtask title"
                      />
                      <button
                        onClick={addSubtaskToNew}
                        className="px-3 py-2 rounded-lg bg-indigo-600 text-white"
                      >
                        Add
                      </button>
                    </div>
                    {(newTask.subtasks || []).length > 0 && (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        {(newTask.subtasks || []).map((s) => (
                          <div
                            key={s.id}
                            className="text-sm px-3 py-2 rounded-lg border bg-gray-50"
                          >
                            {s.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-lg border"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 text-white"
                    onClick={handleAddTask}
                  >
                    Create Task
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {commentTask && (
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-gray-100 flex flex-col gap-4 max-h-[90vh]"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Collaborate on</p>
                    <h3 className="text-xl font-bold text-gray-800">
                      {commentTask.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCommentTask(null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:border-gray-300"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {commentsLoading && comments.length === 0 && (
                    <p className="text-sm text-gray-400">Loading comments…</p>
                  )}
                  {comments.map((comment) => (
                    <CommentBubble
                      key={comment._id || comment.createdAt}
                      comment={comment}
                      viewerEmail={user?.email}
                    />
                  ))}
                  {comments.length === 0 && !commentsLoading && (
                    <p className="text-sm text-gray-400">
                      No comments yet. Start the discussion!
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="font-semibold">Quick mentions:</span>
                    {teammateNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() =>
                          setCommentInput((prev) => {
                            const spacer =
                              prev.endsWith(" ") || prev.length === 0 ? "" : " ";
                            return `${prev}${spacer}@${name} `;
                          })
                        }
                        className="px-3 py-1 rounded-full border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 transition"
                      >
                        @{name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      rows={3}
                      placeholder="Add an update, drop a link, or mention @teammates"
                      className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 focus:ring-4 focus:ring-indigo-200 text-sm"
                    />
                    <button
                      onClick={submitComment}
                      disabled={!commentInput.trim()}
                      className="self-end px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOASTS */}
        <div className="fixed bottom-4 right-4 space-y-2 z-[60]">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white shadow-lg"
              >
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/** ---------------- SMALL COMPONENTS ---------------- */
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white/80 backdrop-blur px-5 py-4 rounded-xl shadow border border-gray-100 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function CommentBubble({
  comment,
  viewerEmail,
}: {
  comment: TaskComment;
  viewerEmail?: string | null;
}) {
  const mine = comment.author?.email === viewerEmail;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow border ${
          mine
            ? "bg-indigo-600 text-white border-indigo-500"
            : "bg-white text-gray-800 border-gray-100"
        }`}
      >
        <p className="text-xs font-semibold">
          {comment.author?.profilename || comment.author?.email || "Teammate"}
        </p>
        <p className="text-sm whitespace-pre-line mt-1">{comment.body}</p>
        <p className={`text-[10px] mt-2 ${mine ? "text-white/80" : "text-gray-400"}`}>
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
