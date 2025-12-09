"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PenSquare, Sparkles } from "lucide-react";

interface NotePayload {
  content: string;
  mentions: string[];
  updatedAt: string | null;
  updatedBy: string | null;
}

interface AccountUser {
  email: string;
  profilename?: string;
  role?: string;
}

export default function NotesWorkspace() {
  const { user, loading, error } = useAuth({ requireSubscription: true });
  const [notes, setNotes] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<AccountUser[]>([]);

  const [hasNotebookAccess, setHasNotebookAccess] = useState<boolean | null>(
    null
  );
  const canEdit = Boolean(user && hasNotebookAccess);

  useEffect(() => {
    if (!user) return;
    const loadNotes = async () => {
      try {
        const res = await fetch("/api/notes");
        if (res.status === 403) {
          setHasNotebookAccess(false);
          return;
        }
        if (!res.ok) throw new Error();
        const data = (await res.json()) as NotePayload;
        setNotes(data.content || "");
        setMentions(data.mentions || []);
        setHasNotebookAccess(true);
      } catch {
        setStatus("Unable to load workspace notes.");
        setHasNotebookAccess(true);
      }
    };
    loadNotes();
  }, [user]);

  useEffect(() => {
    if (!user || !hasNotebookAccess) return;
    const loadAccounts = async () => {
      try {
        const res = await fetch("/api/getAccounts");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAccounts(
          data.map((acct: any) => ({
            email: acct.email,
            profilename: acct.profilename || acct.email,
            role: acct.role,
          }))
        );
      } catch {
        // ignore
      }
    };
    loadAccounts();
  }, [user, hasNotebookAccess]);

  const orderedMentions = useMemo(() => {
    const inlineMentions =
      notes.match(/@([A-Za-z0-9._-]+)/g)?.map((m) => m.replace("@", "")) || [];
    return Array.from(new Set(inlineMentions));
  }, [notes]);

  const insertMention = (value: string) => {
    setNotes((prev) => `${prev}${prev.endsWith(" ") || prev === "" ? "" : " "}@${value} `);
  };

  const saveNotes = async () => {
    if (!canEdit) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notes }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as NotePayload;
      setMentions(data.mentions || []);
      setStatus("Saved");
    } catch {
      setStatus("Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || hasNotebookAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading workspace…
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

  const showUpsell = hasNotebookAccess === false;

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user.role} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-24 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-16 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 pb-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
        >
          Workspace notes
        </motion.h1>
        <p className="text-sm text-gray-500 mt-2">
          Capture ideas, retros, and decisions in one collaborative canvas.
        </p>
        {status && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white/70 px-4 py-2 text-sm text-gray-600">
            {status}
          </p>
        )}

        {showUpsell ? (
          <Upsell />
        ) : (
          <section className="mt-8 grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
            <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <PenSquare className="w-5 h-5 text-indigo-500" />
                  Notebook
                </h2>
                <button
                  onClick={saveNotes}
                  disabled={saving || !canEdit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document strategies, link decisions, or create action lists. Use @name to mention teammates."
                disabled={!canEdit}
                className="flex-1 min-h-[320px] rounded-2xl border border-gray-200 bg-white px-4 py-3 focus:ring-4 focus:ring-indigo-200 text-sm leading-relaxed disabled:opacity-50"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold uppercase tracking-wide">
                  Mentions
                </span>
                {orderedMentions.length === 0 && (
                  <span>No mentions yet. Try typing @ plus a teammate name.</span>
                )}
                {orderedMentions.map((mention) => (
                  <span
                    key={mention}
                    className="px-3 py-1 rounded-full border border-indigo-100 text-indigo-600 bg-indigo-50/60"
                  >
                    @{mention}
                  </span>
                ))}
              </div>
            </div>

            <aside className="bg-white/90 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Quick mention
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pick a teammate to insert an @mention at the end of your note.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {accounts.map((acct) => (
                    <button
                      key={acct.email}
                      type="button"
                      onClick={() =>
                        insertMention(acct.profilename || acct.email)
                      }
                      className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition"
                    >
                      @{acct.profilename || acct.email}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Tips
                </p>
                <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside">
                  <li>Use markdown-style lists (-, *) to structure ideas.</li>
                  <li>Drop links to dashboards or docs to keep context handy.</li>
                  <li>Call out owners with @mentions so they’re notified.</li>
                </ul>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

function Upsell() {
  return (
    <section className="mt-8 bg-white/90 backdrop-blur rounded-3xl border border-indigo-100 shadow-xl p-8 flex flex-col md:flex-row items-center gap-6">
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Enterprise exclusive
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">
          Unlock the collaborative notebook
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Upgrade to the $49.99 Enterprise plan to document strategy, share
          inline mentions, and keep everyone aligned without leaving StockVerse.
        </p>
      </div>
      <div className="space-y-3 w-full md:w-auto text-sm">
        <p className="font-semibold text-gray-700">Enterprise perks</p>
        <ul className="text-gray-500 space-y-1 list-disc list-inside">
          <li>Company-wide notebook with @mentions</li>
          <li>Webhook notifications for important updates</li>
          <li>Shared calendars and premium automations</li>
        </ul>
        <a
          href="/subscription?plan=enterprise"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold shadow hover:scale-[1.02] transition"
        >
          Explore Enterprise
        </a>
      </div>
    </section>
  );
}
