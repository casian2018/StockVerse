"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  Automation,
  KPI_METRICS,
  DATE_FIELDS,
  ROLES,
} from "@/lib/automations";
import { formatDistanceToNow } from "date-fns";

interface FormState {
  name: string;
  description: string;
  triggerType: "kpi" | "date";
  metricId: string;
  comparator: "above" | "below" | "equals";
  threshold: number;
  dateField: string;
  offsetDays: number;
  actionType: "alert" | "task" | "email";
  message: string;
  emailSubject: string;
  emailBody: string;
  taskTitle: string;
  taskDescription: string;
  taskDueOffset: number;
  visibilityRoles: Record<string, boolean>;
}

const defaultForm: FormState = {
  name: "",
  description: "",
  triggerType: "kpi",
  metricId: KPI_METRICS[0].id,
  comparator: "above",
  threshold: 5,
  dateField: DATE_FIELDS[0].id,
  offsetDays: 7,
  actionType: "alert",
  message: "",
  emailSubject: "",
  emailBody: "",
  taskTitle: "",
  taskDescription: "",
  taskDueOffset: 3,
  visibilityRoles: { Admin: true, Manager: true, Guest: false },
};

export default function AutomationPage() {
  const { user, loading, error } = useAuth({ requireSubscription: true });
  const planId = user?.subscription?.planId || user?.businessSubscriptionPlanId;
  const automationsAllowed = planId === "pro" || planId === "enterprise";
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const visibleRoles = useMemo(
    () =>
      ROLES.filter((role) => form.visibilityRoles[role]).map((role) => role),
    [form.visibilityRoles]
  );

  const isAdmin = user?.role === "Admin";

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/automations");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAutomations(data);
    } catch {
      setStatus("Unable to load automations");
    }
  };

  useEffect(() => {
    if (!loading) {
      if (automationsAllowed) fetchAutomations();
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setBusy(true);
    setStatus(null);
    try {
      let actionPayload: Automation["action"];
      if (form.actionType === "task") {
        actionPayload = {
          type: "task",
          task: {
            title: form.taskTitle || form.name,
            description: form.taskDescription || form.description,
            deadlineOffsetDays: form.taskDueOffset,
          },
        };
      } else if (form.actionType === "email") {
        actionPayload = {
          type: "email",
          message: form.message || form.emailSubject || form.name,
          email: {
            subject: form.emailSubject || form.name,
            body:
              form.emailBody ||
              form.message ||
              form.description ||
              "Automation notification",
          },
        };
      } else {
        actionPayload = {
          type: "alert",
          message: form.message || form.name,
        };
      }

      const payload: Partial<Automation> = {
        name: form.name,
        description: form.description,
        trigger:
          form.triggerType === "kpi"
            ? {
                type: "kpi",
                metricId: form.metricId,
                comparator: form.comparator,
                threshold: form.threshold,
              }
            : {
                type: "date",
                dateField: form.dateField,
                offsetDays: form.offsetDays,
              },
        action: actionPayload,
        visibilityRoles: visibleRoles.length ? visibleRoles : ["Admin"],
      };
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setForm({ ...defaultForm });
      setStatus("Automation created");
      fetchAutomations();
    } catch {
      setStatus("Failed to create automation");
    } finally {
      setBusy(false);
    }
  };

  const updateAutomation = async (id: string, updates: any) => {
    await fetch("/api/automations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchAutomations();
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    await fetch("/api/automations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAutomations();
  };

  const runAutomations = async (id?: string) => {
    setStatus(null);
    const res = await fetch("/api/automations/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automationId: id }),
    });
    if (res.ok) {
      const data = await res.json();
      setStatus(`Engine triggered ${data.triggered} automation(s).`);
    } else {
      setStatus("Failed to run automations");
    }
  };

  const describeAction = (action: Automation["action"]) => {
    if (action.type === "task") {
      return action.task?.title
        ? `Task • ${action.task.title}`
        : "Task";
    }
    if (action.type === "email") {
      return `Email • ${action.email?.subject || action.message || "Notification"}`;
    }
    return `Alert • ${action.message || "Notification"}`;
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading automations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Only administrators can manage automations.
      </div>
    );
  }

  if (!automationsAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Automations are available on Pro and Enterprise plans. <a href="/subscription" className="underline font-semibold">Upgrade your plan</a> to enable Automation Studio.
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user.role} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-16 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-20 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 md:pt-10 pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Automation Studio
            </h1>
            <p className="text-gray-500 mt-1">
              Build workflows that react to KPIs, dates, and surface alerts for
              each role.
            </p>
          </div>
          <button
            onClick={() => runAutomations()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold shadow hover:scale-[1.02] transition"
          >
            Run Engine
          </button>
        </div>

        {status && (
          <p className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {status}
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl p-8 mb-10"
        >
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Create Workflow
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Name
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-4 focus:ring-indigo-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-4 focus:ring-indigo-200"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Trigger Type
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                  value={form.triggerType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      triggerType: e.target.value as FormState["triggerType"],
                    })
                  }
                >
                  <option value="kpi">KPI threshold</option>
                  <option value="date">Date proximity</option>
                </select>
              </div>
              {form.triggerType === "kpi" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Metric</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={form.metricId}
                      onChange={(e) =>
                        setForm({ ...form, metricId: e.target.value })
                      }
                    >
                      {KPI_METRICS.map((metric) => (
                        <option key={metric.id} value={metric.id}>
                          {metric.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Comparator</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={form.comparator}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          comparator: e.target
                            .value as FormState["comparator"],
                        })
                      }
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                      <option value="equals">Equals</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Threshold</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={form.threshold}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          threshold: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Date field</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={form.dateField}
                      onChange={(e) =>
                        setForm({ ...form, dateField: e.target.value })
                      }
                    >
                      {DATE_FIELDS.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Trigger within days
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={form.offsetDays}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          offsetDays: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Action
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                  value={form.actionType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      actionType: e.target.value as FormState["actionType"],
                    })
                  }
                >
                  <option value="alert">Send alert</option>
                  <option value="task">Create task</option>
                  <option value="email">Email notification</option>
                </select>
              </div>
              {form.actionType === "task" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Task title</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                      value={form.taskTitle}
                      onChange={(e) =>
                        setForm({ ...form, taskTitle: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Description
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                      rows={2}
                      value={form.taskDescription}
                      onChange={(e) =>
                        setForm({ ...form, taskDescription: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Due in (days)
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                      value={form.taskDueOffset}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          taskDueOffset: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">
                      Alert message
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                      rows={2}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                    />
                  </div>
                  {form.actionType === "email" && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">
                          Email subject
                        </label>
                        <input
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                          value={form.emailSubject}
                          onChange={(e) =>
                            setForm({ ...form, emailSubject: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">
                          Email body
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
                          rows={4}
                          value={form.emailBody}
                          onChange={(e) =>
                            setForm({ ...form, emailBody: e.target.value })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Visibility (roles)
                </label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {ROLES.map((role) => (
                    <label
                      key={role}
                      className="inline-flex items-center gap-2 text-sm text-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={form.visibilityRoles[role]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            visibilityRoles: {
                              ...form.visibilityRoles,
                              [role]: e.target.checked,
                            },
                          })
                        }
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  disabled={busy}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold shadow hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Create automation"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        <div className="space-y-4">
          {automations.map((automation) => (
            <motion.div
              key={automation._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur border border-gray-100 rounded-3xl shadow p-6 flex flex-col gap-3"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-400 tracking-wide">
                    {automation.trigger.type === "kpi"
                      ? "KPI trigger"
                      : "Date trigger"}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {automation.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {automation.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateAutomation(automation._id!, {
                        active: !automation.active,
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      automation.active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {automation.active ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => runAutomations(automation._id)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-indigo-200 text-indigo-600"
                  >
                    Run test
                  </button>
                  <button
                    onClick={() => deleteAutomation(automation._id!)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-rose-200 text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-gray-500">
                    Trigger:
                  </span>{" "}
                  {automation.trigger.type === "kpi"
                    ? `${automation.trigger.metricId} ${automation.trigger.comparator} ${automation.trigger.threshold}`
                    : `${automation.trigger.dateField} within ${automation.trigger.offsetDays} day(s)`}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">
                    Action:
                  </span>{" "}
                  {describeAction(automation.action)}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">
                    Visible to:
                  </span>{" "}
                  {(automation.visibilityRoles || []).join(", ")}
                </div>
              </div>
              {automation.lastRunAt && (
                <p className="text-xs text-gray-400">
                  Last run{" "}
                  {formatDistanceToNow(new Date(automation.lastRunAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </motion.div>
          ))}
          {automations.length === 0 && (
            <p className="text-center text-gray-500">
              No automations yet. Create one to get started.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
