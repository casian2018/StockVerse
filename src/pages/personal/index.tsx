"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";

interface Personal {
  legalname: string;
  email: string;
  role: string;
  phone: string;
  salary: number;
  startDate: string;
  age: number;
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
    salary: 0,
    startDate: "",
    age: 0,
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
      setNewPerson({
        legalname: "",
        email: "",
        role: "",
        phone: "",
        salary: 0,
        startDate: "",
        age: 0,
      });
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
      setPerson(
        (prev) =>
          prev?.map((p) =>
            p.email === editingPerson.email ? editingPerson : p
          ) || []
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

        {/* Add New Person Form */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Add New Person</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPerson();
            }}
            className="flex flex-wrap gap-4"
          >
            <label className="w-full md:w-[24%]">
              Legal Name
              <input
                type="text"
                placeholder="Legal Name"
                value={newPerson.legalname}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, legalname: e.target.value })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <label className="w-full md:w-[24%]">
              Email
              <input
                type="email"
                placeholder="Email"
                value={newPerson.email}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, email: e.target.value })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <label className="w-full md:w-[24%]">
              Role
              <input
                type="text"
                placeholder="Role"
                value={newPerson.role}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, role: e.target.value })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <label className="w-full md:w-[24%]">
              Phone Number
              <input
                type="text"
                placeholder="Phone Number"
                value={newPerson.phone}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, phone: e.target.value })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <label className="w-full md:w-[24%]">
              Salary
              <input
                type="number"
                placeholder="Salary"
                value={newPerson.salary}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, salary: Number(e.target.value) })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <label className="w-full md:w-[24%]">
              Start Date
              <input
                type="date"
                placeholder="Start Date"
                value={newPerson.startDate}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, startDate: e.target.value })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <label className="w-full md:w-[24%]">
              Age
              <input
                type="number"
                placeholder="Age"
                value={newPerson.age}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, age: Number(e.target.value) })
                }
                className="border p-2 rounded w-full"
                required
              />
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-all"
            >
              Add Person
            </button>
          </form>
        </div>

        {/* Edit Person Form */}
        {editingPerson && (
          <div className="mb-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Edit Person</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editPerson();
              }}
              className="flex flex-wrap gap-4"
            >
              <label className="w-full md:w-[24%]">
                Legal Name
                <input
                  type="text"
                  placeholder="Legal Name"
                  value={editingPerson.legalname}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      legalname: e.target.value,
                    })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <label className="w-full md:w-[24%]">
                Email
                <input
                  type="email"
                  placeholder="Email"
                  value={editingPerson.email}
                  onChange={(e) =>
                    setEditingPerson({ ...editingPerson, email: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <label className="w-full md:w-[24%]">
                Role
                <input
                  type="text"
                  placeholder="Role"
                  value={editingPerson.role}
                  onChange={(e) =>
                    setEditingPerson({ ...editingPerson, role: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <label className="w-full md:w-[24%]">
                Phone Number
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={editingPerson.phone}
                  onChange={(e) =>
                    setEditingPerson({ ...editingPerson, phone: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <label className="w-full md:w-[24%]">
                Salary
                <input
                  type="number"
                  placeholder="Salary"
                  value={editingPerson.salary}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      salary: Number(e.target.value),
                    })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <label className="w-full md:w-[24%]">
                Start Date
                <input
                  type="date"
                  placeholder="Start Date"
                  value={editingPerson.startDate}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      startDate: e.target.value,
                    })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <label className="w-full md:w-[24%]">
                Age
                <input
                  type="number"
                  placeholder="Age"
                  value={editingPerson.age}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      age: Number(e.target.value),
                    })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingPerson(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        {person && person.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-gray-200 text-left text-gray-600 text-sm">
                  <th className="p-4">Legal Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Salary</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Age</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {person.map((p) => (
                  <tr key={p.email} className="border-t hover:bg-gray-100">
                    <td className="p-4">{p.legalname}</td>
                    <td className="p-4">{p.email}</td>
                    <td className="p-4">{p.role}</td>
                    <td className="p-4">{p.phone}</td>
                    <td className="p-4">{p.salary}</td>
                    <td className="p-4">{p.startDate}</td>
                    <td className="p-4">{p.age}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => setEditingPerson(p)}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePerson(p.email)}
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
            No personal data available.
          </p>
        )}
      </main>
    </div>
  );
}