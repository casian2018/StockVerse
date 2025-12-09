"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle2, Inbox } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { AutomationAlert } from "@/lib/automations";

interface Notification extends AutomationAlert {
  read?: boolean;
}

export default function NotificationsPage() {
  const { user, loading, error } = useAuth({ requireSubscription: true });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiError, setNotiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadNotifications = async () => {
    try {
      setBusy(true);
      setNotiError(null);
      const res = await fetch("/api/automations/alerts?includeRead=true");
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setNotiError("Unable to load notifications");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const acknowledge = async (alertId?: string, markAll = false) => {
    try {
      setBusy(true);
      await fetch("/api/automations/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, markAll }),
      });
      await loadNotifications();
    } catch (err) {
      console.error(err);
      setNotiError("Unable to update notifications");
      setBusy(false);
    }
  };

  const unread = useMemo(
    () => notifications.filter((alert) => !alert.read),
    [notifications]
  );
  const history = useMemo(
    () => notifications.filter((alert) => alert.read),
    [notifications]
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading notifications...
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

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user.role} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="pointer-events-none absolute top-28 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="pointer-events-none absolute bottom-16 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
          >
            Notifications
          </motion.h1>
          <div className="flex gap-3">
            <button
              onClick={() => loadNotifications()}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300"
            >
              Refresh
            </button>
            <button
              disabled={!unread.length || busy}
              onClick={() => acknowledge(undefined, true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:scale-[1.01] transition disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>
        {notiError && (
          <p className="mt-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-600">
            {notiError}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <section className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Unread alerts
                </h2>
                <span className="inline-flex items-center justify-center text-xs font-semibold bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5">
                  {unread.length}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {unread.length === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                  <Inbox className="w-10 h-10 mb-3" />
                  <p className="text-sm">Nothing new right now.</p>
                </div>
              )}
              {unread.map((alert) => (
                <article
                  key={alert._id}
                  className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {alert.message}
                    </p>
                    <button
                      onClick={() => acknowledge(alert._id)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-indigo-500 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {alert.action.type}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-800">
                History
              </h2>
            </div>
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {history.length === 0 && (
                <p className="text-sm text-gray-400">
                  Read notifications will appear here for quick reference.
                </p>
              )}
              {history.map((alert) => (
                <article
                  key={alert._id}
                  className="rounded-2xl border border-gray-100 px-5 py-4 bg-gray-50/70"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {alert.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5">
                      <Bell className="w-3 h-3 text-indigo-400" />
                      {alert.action.type}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
