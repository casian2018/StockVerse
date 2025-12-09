"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Send, Users } from "lucide-react";

interface ChatUser {
  email: string;
  profilename: string;
  role?: string;
  department?: string | null;
}

interface ChatMessage {
  _id?: string;
  senderEmail: string;
  recipientEmail: string;
  body: string;
  createdAt: string;
}

export default function ChatPage() {
  const { user, loading, error } = useAuth({ requireSubscription: true });
  const planId = user?.subscription?.planId || user?.businessSubscriptionPlanId;
  const chatAllowed = planId === "pro" || planId === "enterprise";
  const [peers, setPeers] = useState<ChatUser[]>([]);
  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const audienceLabel = useMemo(() => {
    if (!user?.role) return "";
    if (user.role === "Admin") return "You can reach every employee.";
    if (user.role === "Manager")
      return "You can chat with Guests assigned to your department.";
    if (user.role === "Guest")
      return "You can chat with your department's manager.";
    return "";
  }, [user?.role]);

  const fetchPeers = useCallback(async () => {
    try {
      setStatus(null);
      const res = await fetch("/api/chat/users");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as ChatUser[];
      setPeers(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      } else if (selected) {
        const stillExists = data.find((peer) => peer.email === selected.email);
        if (!stillExists) {
          setSelected(null);
          setMessages([]);
        }
      }
    } catch {
      setStatus("Unable to load chat participants.");
    }
  }, [selected]);

  const fetchMessages = useCallback(
    async (partner: ChatUser) => {
      if (!partner) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(
          `/api/chat/messages?with=${encodeURIComponent(partner.email)}`
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as ChatMessage[];
        setMessages(data);
        setStatus(null);
      } catch {
        setStatus("Unable to load conversation.");
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!loading && user) {
      if (chatAllowed) fetchPeers();
    }
  }, [loading, user, fetchPeers]);

  useEffect(() => {
    if (!selected) return;
    if (!chatAllowed) return;
    fetchMessages(selected);
    const interval = setInterval(() => fetchMessages(selected), 2000);
    return () => clearInterval(interval);
  }, [selected, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!composer.trim() || !selected || !user?.email) return;
    const optimistic: ChatMessage = {
      _id: `tmp-${Date.now()}`,
      senderEmail: user.email,
      recipientEmail: selected.email,
      body: composer.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setComposer("");
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected.email, message: optimistic.body }),
      });
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as ChatMessage;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === optimistic._id ? saved : msg))
      );
    } catch {
      setStatus("Failed to send message.");
      setMessages((prev) => prev.filter((msg) => msg._id !== optimistic._id));
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading chat...
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
        className="absolute top-20 left-16 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-20 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 pb-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4"
        >
          Team chat
        </motion.h1>
        {audienceLabel && (
          <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            {audienceLabel}
          </p>
        )}
        {status && (
          <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {status}
          </p>
        )}

        {!chatAllowed && (
          <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Chat is available on Pro and Enterprise plans. <a href="/subscription" className="underline font-semibold">Upgrade your plan</a> to enable team chat.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <section className="bg-white/80 border border-gray-100 rounded-3xl shadow p-4 flex flex-col min-h-[520px]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600 uppercase">
                Conversations
              </p>
              <button
                onClick={fetchPeers}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Refresh
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {peers.length === 0 && (
                <p className="text-sm text-gray-500">
                  No available peers yet. Confirm department assignments and try
                  again.
                </p>
              )}
              {peers.map((peer) => (
                <button
                  key={peer.email}
                  onClick={() => setSelected(peer)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    selected?.email === peer.email
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-gray-100 hover:border-indigo-200"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    {peer.profilename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {peer.role} • {peer.department || "No department"}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white/80 border border-gray-100 rounded-3xl shadow flex flex-col min-h-[520px]">
            {selected ? (
              <>
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selected.profilename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selected.role} • {selected.department || "No department"}
                    </p>
                  </div>
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-white/50">
                  {loadingMessages && messages.length === 0 && (
                    <p className="text-sm text-gray-400">
                      Loading conversation...
                    </p>
                  )}
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg._id}
                      message={msg}
                      currentEmail={user.email}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="border-t border-gray-100 px-4 py-3 flex items-center gap-3"
                >
                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Write a message..."
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    type="submit"
                    disabled={!composer.trim()}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-4 py-2 font-semibold disabled:opacity-50 flex items-center gap-1"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                <MessageCircle className="w-12 h-12 text-indigo-300 mb-4" />
                <p className="text-lg font-semibold text-gray-700">
                  Select someone to start chatting
                </p>
                <p className="text-sm text-gray-500">
                  Pick a teammate from the list to load the conversation.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({
  message,
  currentEmail,
}: {
  message: ChatMessage;
  currentEmail?: string | null;
}) {
  const mine = message.senderEmail === currentEmail;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow ${
          mine
            ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <p>{message.body}</p>
        <p className="text-[10px] opacity-70 mt-1">
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
