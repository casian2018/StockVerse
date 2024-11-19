"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";

interface Personal {
  legalname: string;
  email: string;
  role: string;
  phone: string;
}

export default function PersonalPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [person, setPerson] = useState<Personal[] | null>(null);
  const [newPerson, setNewPerson] = useState<Personal>({
    legalname: "",
    email: "",
    role: "",
    phone: "",
  });
  const [editingPerson, setEditingPerson] = useState<Personal | null>(null);

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
    const fetchPersonData = async () => {
      try {
        const response = await fetch("/api/getUserInfo");
        if (!response.ok) throw new Error("Failed to fetch personal data");
        const data = await response.json();
        setPerson(data.personal || []);
      } catch {
        setError("Failed to fetch personal data");
      } finally {
        setLoading(false);
      }
    };
    fetchPersonData();
  }, []);

  const deletePerson = async (email: string) => {
    try {
      const response = await fetch("/api/deleteUserInfo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setPerson((prev) => prev?.filter((p) => p.email !== email) || []);
    } catch {
      setError("Failed to delete person");
    }
  };

  const addPerson = async () => {
    try {
      const response = await fetch("/api/addUserInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerson),
      });
      if (!response.ok) throw new Error();
      setPerson((prev) => (prev ? [...prev, newPerson] : [newPerson]));
      setNewPerson({ legalname: "", email: "", role: "", phone: "" });
    } catch {
      setError("Failed to add person");
    }
  };

  const editPerson = async () => {
    if (!editingPerson) return;
    try {
      const response = await fetch("/api/editUserInfo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPerson),
      });
      if (!response.ok) throw new Error();
      setPerson((prev) =>
        prev?.map((p) => (p.email === editingPerson.email ? editingPerson : p)) || []
      );
      setEditingPerson(null);
    } catch {
      setError("Failed to edit person");
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="font-inter text-gray-800">
      <Sidebar />
      <main className="w-full md:w-[calc(100%-256px)] md:ml-64 bg-gray-50 min-h-screen transition-all px-8 py-4">
        <h1 className="text-3xl font-bold py-4">Personal</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold">Add New Person</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPerson();
            }}
          >
            <input
              type="text"
              placeholder="Legal Name"
              value={newPerson.legalname}
              onChange={(e) => setNewPerson({ ...newPerson, legalname: e.target.value })}
              className="border p-2 mr-4"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newPerson.email}
              onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
              className="border p-2 mr-4"
              required
            />
            <input
              type="text"
              placeholder="Role"
              value={newPerson.role}
              onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
              className="border p-2 mr-4"
              required
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={newPerson.phone}
              onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
              className="border p-2 mr-4"
              required
            />
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
              Add Person
            </button>
          </form>
        </div>

        {editingPerson && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Edit Person</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editPerson();
              }}
            >
              <input
                type="text"
                placeholder="Legal Name"
                value={editingPerson.legalname}
                onChange={(e) =>
                  setEditingPerson({ ...editingPerson, legalname: e.target.value })
                }
                className="border p-2 mr-4"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={editingPerson.email}
                onChange={(e) =>
                  setEditingPerson({ ...editingPerson, email: e.target.value })
                }
                className="border p-2 mr-4"
                required
              />
              <input
                type="text"
                placeholder="Role"
                value={editingPerson.role}
                onChange={(e) =>
                  setEditingPerson({ ...editingPerson, role: e.target.value })
                }
                className="border p-2 mr-4"
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={editingPerson.phone}
                onChange={(e) =>
                  setEditingPerson({ ...editingPerson, phone: e.target.value })
                }
                className="border p-2 mr-4"
                required
              />
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingPerson(null)}
                className="ml-2 px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {person && person.length > 0 ? (
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th>Legal Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {person.map((p) => (
                <tr key={p.email}>
                  <td>{p.legalname}</td>
                  <td>{p.email}</td>
                  <td>{p.role}</td>
                  <td>{p.phone}</td>
                  <td>
                    <button
                      onClick={() => setEditingPerson(p)}
                      className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePerson(p.email)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center">No personal data available.</p>
        )}
      </main>
    </div>
  );
}