"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  differenceInMonths,
  differenceInYears,
  format,
  formatDistanceToNow,
} from "date-fns";

interface Personal {
  legalname: string;
  email: string;
  role: string;
  phone: string;
  salary: number;
  startDate: string;
  birthDate: string;
  department: string;
}

const emptyPersonal: Personal = {
  legalname: "",
  email: "",
  role: "",
  phone: "",
  salary: 0,
  startDate: "",
  birthDate: "",
  department: "",
};

const personalFormFields: Array<{
  label: string;
  key: keyof Personal;
  type: "text" | "email" | "tel" | "number" | "date";
  readonlyOnEdit?: boolean;
}> = [
  { label: "Legal Name", key: "legalname", type: "text" },
  { label: "Email", key: "email", type: "email", readonlyOnEdit: true },
  { label: "Role / Title", key: "role", type: "text" },
  { label: "Phone", key: "phone", type: "tel" },
  { label: "Salary (annual)", key: "salary", type: "number" },
  { label: "Start Date", key: "startDate", type: "date" },
  { label: "Birth Date", key: "birthDate", type: "date" },
  { label: "Department", key: "department", type: "text" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatDate = (value?: string) =>
  value ? format(new Date(value), "MMM d, yyyy") : "—";

const calculateAge = (birthDate?: string) =>
  birthDate ? differenceInYears(new Date(), new Date(birthDate)) : null;

const tenureLabel = (startDate?: string) =>
  startDate
    ? formatDistanceToNow(new Date(startDate), { addSuffix: true })
    : "—";

export default function PersonalPage() {
  const { user, loading: authLoading, error: authError } = useAuth({
    requireSubscription: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [person, setPerson] = useState<Personal[]>([]);
  const [newPerson, setNewPerson] = useState<Personal>({ ...emptyPersonal });
  const [editingPerson, setEditingPerson] = useState<Personal | null>(null);

  const normalizePerson = (data: Partial<Personal>): Personal => ({
    ...emptyPersonal,
    ...data,
    salary: Number(data.salary ?? 0),
  });

  const handleNewPersonChange = <K extends keyof Personal>(
    field: K,
    value: string
  ) => {
    setNewPerson((prev) => ({
      ...prev,
      [field]: field === "salary" ? Number(value) : value,
    }));
  };

  const handleEditPersonChange = <K extends keyof Personal>(
    field: K,
    value: string
  ) => {
    setEditingPerson((prev) =>
      prev
        ? {
            ...prev,
            [field]: field === "salary" ? Number(value) : value,
          }
        : prev
    );
  };

  const teamMetrics = useMemo(() => {
    const headcount = person.length;
    const payroll = person.reduce(
      (sum, member) => sum + (Number(member.salary) || 0),
      0
    );
    const totalMonths = person.reduce((sum, member) => {
      if (!member.startDate) return sum;
      const parsed = new Date(member.startDate);
      if (Number.isNaN(parsed.getTime())) return sum;
      return sum + Math.max(differenceInMonths(new Date(), parsed), 0);
    }, 0);

    const avgTenure =
      headcount > 0 && totalMonths > 0
        ? `${(totalMonths / headcount / 12).toFixed(1)} yrs`
        : "—";

    return [
      {
        label: "Headcount",
        value: headcount.toString(),
        sublabel: "Active team members",
      },
      {
        label: "Avg. Tenure",
        value: avgTenure,
        sublabel: "Time since start date",
      },
      {
        label: "Annual Payroll",
        value: currencyFormatter.format(payroll),
        sublabel: "Based on current salaries",
      },
    ];
  }, [person]);

  useEffect(() => {
    if (authLoading) return;
    const records = Array.isArray(user?.personal)
      ? (user.personal as Array<Partial<Personal>>).map((entry) =>
          normalizePerson(entry)
        )
      : [];
    setPerson(records);
  }, [authLoading, user]);

  const addPerson = async () => {
    try {
      setError(null);
      const res = await fetch("/api/addUserInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerson),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerson((prev) => [...prev, normalizePerson(data.person)]);
      setNewPerson({ ...emptyPersonal });
    } catch {
      setError("Failed to add person");
    }
  };

  const deletePerson = async (email: string) => {
    try {
      setError(null);
      const res = await fetch("/api/deleteUserInfo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setPerson((prev) => prev.filter((p) => p.email !== email));
    } catch {
      setError("Failed to delete");
    }
  };

  const editPerson = async () => {
    if (!editingPerson) return;
    try {
      setError(null);
      const res = await fetch("/api/editUserInfo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPerson),
      });
      if (!res.ok) throw new Error();
      setPerson((prev) =>
        prev.map((p) => (p.email === editingPerson.email ? editingPerson : p))
      );
      setEditingPerson(null);
    } catch {
      setError("Failed to update");
    }
  };

  if (authLoading && !user) return <p className="text-center mt-10">Loading...</p>;
  if (authError)
    return (
      <p className="text-center text-red-500 font-semibold mt-10">
        {authError}
      </p>
    );

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user?.role} />

      {/* Animated Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-16 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-20 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 md:pt-10 pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-8"
        >
          Team Members
        </motion.h1>
        {error && (
          <p className="mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        {/* Add New Person */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Add New Team Member
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPerson();
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {personalFormFields.map(({ label, key, type }) => {
              const fieldValue = newPerson[key];
              const inputValue =
                typeof fieldValue === "number" ? fieldValue : fieldValue ?? "";
              return (
                <div key={key}>
                  <label className="text-sm font-semibold text-gray-600">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={inputValue}
                    onChange={(e) =>
                      handleNewPersonChange(key, e.target.value)
                    }
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
                    required
                  />
                </div>
              );
            })}
            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-xl shadow hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                + Add Person
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          {teamMetrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white/80 backdrop-blur border border-gray-100 rounded-2xl shadow-lg p-6"
            >
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold mt-2 text-gray-800">
                {metric.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{metric.sublabel}</p>
            </div>
          ))}
        </motion.div>

        {/* People Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl overflow-hidden"
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
              <tr>
                {[
                  "Legal Name",
                  "Email",
                  "Role",
                  "Department",
                  "Phone",
                  "Salary",
                  "Start Date",
                  "Tenure",
                  "Birth Date",
                  "Age",
                  "Actions",
                ].map((header) => (
                  <th key={header} className="px-6 py-4 text-sm font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {person.map((p, i) => {
                  const ageValue = calculateAge(p.birthDate);
                  return (
                    <motion.tr
                    key={p.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-t border-gray-100 hover:bg-indigo-50/30 transition-all"
                  >
                    <td className="px-6 py-4 font-medium">{p.legalname}</td>
                    <td className="px-6 py-4">{p.email}</td>
                    <td className="px-6 py-4">{p.role || "—"}</td>
                    <td className="px-6 py-4">{p.department || "—"}</td>
                    <td className="px-6 py-4">{p.phone || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">
                      {currencyFormatter.format(Number(p.salary) || 0)}
                    </td>
                    <td className="px-6 py-4">{formatDate(p.startDate)}</td>
                    <td className="px-6 py-4">{tenureLabel(p.startDate)}</td>
                    <td className="px-6 py-4">{formatDate(p.birthDate)}</td>
                    <td className="px-6 py-4">
                      {ageValue !== null ? `${ageValue} yrs` : "—"}
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => setEditingPerson(normalizePerson(p))}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm rounded-lg shadow hover:scale-[1.05] transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePerson(p.email)}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm rounded-lg shadow hover:scale-[1.05] transition-all"
                      >
                        Delete
                      </button>
                    </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingPerson && (
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
                  Edit Person
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    editPerson();
                  }}
                  className="grid grid-cols-1 gap-4"
                >
                  {personalFormFields.map(({ label, key, type, readonlyOnEdit }) => {
                    const fieldValue = editingPerson[key];
                    const inputValue =
                      typeof fieldValue === "number"
                        ? fieldValue
                        : fieldValue ?? "";
                    return (
                      <div key={key}>
                        <label className="text-sm text-gray-600">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={inputValue}
                          onChange={(e) =>
                            handleEditPersonChange(key, e.target.value)
                          }
                          disabled={Boolean(readonlyOnEdit)}
                          readOnly={Boolean(readonlyOnEdit)}
                          className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300"
                          required
                        />
                      </div>
                    );
                  })}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingPerson(null)}
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
