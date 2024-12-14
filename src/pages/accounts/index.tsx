"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";

interface Account {
    _id: string;
    email: string;
    busniess: string;
    role: string;
    password?: string;
}

export default function AccountsPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<Account | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[] | null>(null);
    const [newAccount, setNewAccount] = useState<Omit<Account, "busniess" | "_id">>({
        email: "",
        role: "",
        password: "",
    });
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

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

      async function createAccount(email: any, role: any, password: any) {
        const response = await fetch('/api/addAccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, role, password }),
        });
    
        const data = await response.json();
        if (response.ok) {
            console.log('Account created successfully:', data);
        } else {
            console.error('Failed to create account:', data);
        }
    }
    

    useEffect(() => {
        const fetchAccountsData = async () => {
            try {
                const response = await fetch("/api/getAccounts");
                if (!response.ok) throw new Error("Failed to fetch accounts data");
                const data: Account[] = await response.json();
                if (user) {
                    const filteredAccounts = data.filter(
                        (account: Account) => account.busniess === user.busniess
                    );
                    setAccounts(filteredAccounts);
                }
            } catch {
                setError("Failed to fetch accounts data");
            } finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchAccountsData();
        }
    }, [user]);

    const deleteAccount = async (id: string) => {
        try {
            const response = await fetch("/api/deleteAccount", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!response.ok) throw new Error();
            setAccounts((prev) => prev?.filter((a) => a._id !== id) || []);
        } catch {
            setError("Failed to delete account");
        }
    };


    const editAccount = async () => {
        if (!editingAccount) return;
        try {
            const response = await fetch("/api/editAccount", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingAccount),
            });
            if (!response.ok) throw new Error();
            setAccounts(
                (prev) =>
                    prev?.map((a) =>
                        a._id === editingAccount._id ? editingAccount : a
                    ) || []
            );
            setEditingAccount(null);
        } catch {
            setError("Failed to edit account");
        }
    };

    if (loading) return <p className="text-center">Loading...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="font-inter text-gray-800">
            <Sidebar />
            <main className="w-full md:w-[calc(100%-256px)] md:ml-64 bg-gray-50 min-h-screen transition-all px-8 py-4">
                <h1 className="text-3xl font-bold py-4">Accounts</h1>

                {/* Add New Account Form */}
                <div className="mb-8 p-4 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4">Add New Account</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createAccount(newAccount.email, newAccount.role, newAccount.password);
                        }}
                        className="flex flex-wrap gap-4"
                    >
                        <label className="w-full md:w-[24%]">
                            Email
                            <input
                                type="email"
                                placeholder="Email"
                                value={newAccount.email}
                                onChange={(e) =>
                                    setNewAccount({ ...newAccount, email: e.target.value })
                                }
                                className="border p-2 rounded w-full"
                                required
                            />
                        </label>
                        <label className="w-full md:w-[24%]">
                            Role
                            <select
                                value={newAccount.role}
                                onChange={(e) =>
                                    setNewAccount({ ...newAccount, role: e.target.value })
                                }
                                className="border p-2 rounded w-full"
                                required
                            >
                                <option value="Guest">Guest</option>
                                <option value="Manager">Manager</option>
                            </select>
                        </label>
                        <label className="w-full md:w-[24%]">
                            Password
                            <input
                                type="password"
                                placeholder="Password"
                                value={newAccount.password}
                                onChange={(e) =>
                                    setNewAccount({ ...newAccount, password: e.target.value })
                                }
                                className="border p-2 rounded w-full"
                                required
                            />
                        </label>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-all"
                        >
                            Add Account
                        </button>
                    </form>
                </div>

                {/* Edit Account Form */}
                {editingAccount && (
                    <div className="mb-8 p-4 bg-white rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-4">Edit Account</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                editAccount();
                            }}
                            className="flex flex-wrap gap-4"
                        >
                            <label className="w-full md:w-[24%]">
                                Email
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={editingAccount.email}
                                    onChange={(e) =>
                                        setEditingAccount({
                                            ...editingAccount,
                                            email: e.target.value,
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </label>
                            <label className="w-full md:w-[24%]">
                                Role
                                <select
                                    value={editingAccount.role}
                                    onChange={(e) =>
                                        setEditingAccount({
                                            ...editingAccount,
                                            role: e.target.value,
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                    required
                                >
                                    <option value="Guest">Guest</option>
                                    <option value="Manager">Manager</option>
                                    </select>
                            </label>
                            <label className="w-full md:w-[24%]"></label>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
                            >
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingAccount(null)}
                                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-all"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                )}

                {/* Table */}
                {accounts && accounts.length > 0 ? (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="table-auto w-full">
                            <thead>
                                <tr className="bg-gray-200 text-left text-gray-600 text-sm">
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((a) => (
                                    <tr key={a._id} className="border-t hover:bg-gray-100">
                                        <td className="p-4">{a.email}</td>
                                        <td className="p-4">{a.role}</td>
                                        <td className="p-4 flex gap-2">
                                            <button
                                                onClick={() => setEditingAccount(a)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteAccount(a._id)}
                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        No accounts data available.
                    </p>
                )}
            </main>
        </div>
    );
}