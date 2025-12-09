"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface Account {
  _id: string;
  email: string;
  business: string;
  role: string;
  password?: string;
}

export default function AccountsPage() {
  const { user, loading: authLoading, error: authError } = useAuth({
    requireSubscription: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState({
    email: "",
    role: "Guest",
    password: "",
  });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // 📥 Fetch accounts
  const loadAccounts = useCallback(async () => {
    if (!user?.business) {
      setAccountsLoading(false);
      return;
    }
    try {
      setAccountsLoading(true);
      setError(null);
      const response = await fetch("/api/getAccounts");
      if (!response.ok) throw new Error();
      const data: Account[] = await response.json();
      const filtered = data.filter((a) => a.business === user.business);
      setAccounts(filtered);
    } catch {
      setError("Failed to load accounts");
    } finally {
      setAccountsLoading(false);
    }
  }, [user?.business]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // ➕ Add Account
  const createAccount = async () => {
    try {
      const res = await fetch("/api/addAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.message || "Failed to add account");
        return;
      }
      await loadAccounts();
      setNewAccount({ email: "", role: "Guest", password: "" });
    } catch {
      setError("Failed to add account");
    }
  };

  // 🗑️ Delete
  const deleteAccount = async (id: string) => {
    try {
      await fetch("/api/deleteAccount", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadAccounts();
    } catch {
      setError("Failed to delete");
    }
  };

  // ✏️ Edit
  const editAccount = async () => {
    if (!editingAccount) return;
    try {
      await fetch("/api/editAccount", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAccount),
      });
      await loadAccounts();
      setEditingAccount(null);
    } catch {
      setError("Failed to edit account");
    }
  };

  if ((authLoading && !user) || accountsLoading)
    return <p className="text-center text-gray-500 mt-10">Loading...</p>;
  if (authError || error)
    return (
      <p className="text-center text-red-500 font-semibold mt-10">
        {authError || error}
      </p>
    );

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user?.role} />

      {/* 🌀 Background Orbs */}
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
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-10"
        >
          Account Management
        </motion.h1>

        {/* ➕ Add Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl p-8 mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Add New Account
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createAccount();
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={newAccount.email}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, email: e.target.value })
                }
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Role</label>
              <select
                value={newAccount.role}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, role: e.target.value })
                }
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
              >
                <option value="Guest">Guest</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Password
              </label>
              <input
                type="password"
                value={newAccount.password}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, password: e.target.value })
                }
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
                required
              />
            </div>
            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-xl shadow hover:scale-[1.02] transition-all"
              >
                + Add Account
              </button>
            </div>
          </form>
        </motion.div>

        {/* 📋 Accounts Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl overflow-hidden"
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Email
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Role
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {accounts.map((a, i) => (
                  <motion.tr
                    key={a._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-gray-100 hover:bg-indigo-50/30 transition-all"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {a.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          a.role === "Manager"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => setEditingAccount(a)}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm rounded-lg shadow hover:scale-[1.05] transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAccount(a._id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm rounded-lg shadow hover:scale-[1.05] transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>

        {/* ✏️ Edit Modal */}
        <AnimatePresence>
          {editingAccount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg"
              >
                <h3 className="text-2xl font-bold mb-6 text-gray-800">
                  Edit Account
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    editAccount();
                  }}
                  className="grid grid-cols-1 gap-4"
                >
                  <label>
                    <span className="text-sm text-gray-600">Email</span>
                    <input
                      type="email"
                      value={editingAccount.email}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          email: e.target.value,
                        })
                      }
                      className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300"
                      required
                    />
                  </label>
                  <label>
                    <span className="text-sm text-gray-600">Role</span>
                    <select
                      value={editingAccount.role}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          role: e.target.value,
                        })
                      }
                      className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300"
                    >
                      <option value="Guest">Guest</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </label>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingAccount(null)}
                      className="px-4 py-2 rounded-xl border bg-gray-100 hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:opacity-90 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
