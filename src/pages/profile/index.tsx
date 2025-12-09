"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface ProfileUser {
  email: string;
  profilename: string;
  business: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const { user: authUser, loading: authLoading, error: authError, refresh } =
    useAuth({ requireSubscription: true });
  const baseProfile = useMemo<ProfileUser | null>(() => {
    if (!authUser) return null;
    return {
      email: authUser.email ?? "",
      profilename: authUser.profilename ?? "",
      business: authUser.business ?? "",
      phone: authUser.phone ?? "",
      role: authUser.role ?? "Guest",
    };
  }, [authUser]);
  const [updatedUser, setUpdatedUser] = useState<ProfileUser | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseProfile) return;
    setUpdatedUser(baseProfile);
  }, [baseProfile]);

  const handleInputChange = (field: keyof ProfileUser, value: string) => {
    if (updatedUser) setUpdatedUser({ ...updatedUser, [field]: value });
  };

  const saveChanges = async () => {
    if (!updatedUser) return;
    try {
      setError(null);
      const res = await fetch("/api/updateUserProfile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setUpdatedUser(updated);
      await refresh();
      setEditMode(false);
    } catch {
      setError("Failed to save changes.");
    }
  };

  if (authLoading && !authUser)
    return <p className="text-center mt-10 text-gray-600">Loading...</p>;
  if (authError)
    return <p className="text-center text-red-500 mt-10">{authError}</p>;
  if (!updatedUser)
    return <p className="text-center mt-10 text-gray-600">Preparing profile…</p>;

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-inter">
      <Sidebar role={authUser?.role} />

      {/* Background Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-16 w-80 h-80 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-20 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 flex items-center justify-center px-4 sm:px-8 md:px-10 pt-24 md:pt-10 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-2xl w-full max-w-3xl p-10"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {authUser?.profilename?.[0]?.toUpperCase() || "U"}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              {authUser?.profilename || "User Profile"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{authUser?.email}</p>
          </div>
          {error && (
            <p className="mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </p>
          )}

          {/* Profile Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveChanges();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { label: "Profilename", key: "profilename", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Business", key: "business", type: "text" },
              { label: "Phone", key: "phone", type: "tel" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  {field.label}
                </label>
                {editMode ? (
                  <input
                    type={field.type}
                    value={(updatedUser as any)[field.key] || ""}
                    onChange={(e) =>
                      handleInputChange(
                        field.key as keyof ProfileUser,
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 bg-white/70 transition-all"
                    required
                  />
                ) : (
                  <p className="text-gray-800 font-medium px-2 py-2 rounded-lg bg-gray-50 border border-gray-100">
                    {(authUser as any)[field.key]}
                  </p>
                )}
              </div>
            ))}

            {/* Role */}
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">
                Role
              </label>
              <p className="text-gray-800 font-medium px-2 py-2 rounded-lg bg-gray-50 border border-gray-100">
                {authUser?.role}
              </p>
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex justify-end mt-6 gap-3">
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (baseProfile) {
                        setUpdatedUser(baseProfile);
                      }
                      setEditMode(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold shadow hover:scale-[1.02] transition-all"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold shadow hover:scale-[1.02] transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
