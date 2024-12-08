"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar";

interface User {
  email: string;
  profilename: string;
  business: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/getUserInfo", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setUser(userData);
        setUpdatedUser(userData); // Initialize updated user state for editing
      } catch (err) {
        setError("Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/checkAuth", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        const userData = await response.json();
        setUser(userData); // Set user if authenticated
        setLoading(false);
      } catch (err) {
        setError("You need to log in.");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Update state when editing fields
  const handleInputChange = (field: keyof User, value: string) => {
    if (updatedUser) {
      setUpdatedUser({ ...updatedUser, [field]: value });
    }
  };

  // Save changes to the database
  const saveChanges = async () => {
    try {
      const response = await fetch("/api/updateUserProfile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedData = await response.json();

      // Reflect the changes in the UI
      setUser(updatedData);
      setUpdatedUser(updatedData);
      setEditMode(false);
    } catch (err) {
      router.reload();
    }
  };

  // Reload details if edit is canceled
  const cancelEdit = () => {
    setUpdatedUser(user);
    setEditMode(false);
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 font-semibold">{error}</p>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 w-full">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
          Profile
        </h1>

        {/* Profile Details */}
        {user && (
          <div className="space-y-8">
            {/* Profilename */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Profilename
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={updatedUser?.profilename || ""}
                  onChange={(e) =>
                    handleInputChange("profilename", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              ) : (
                <p className="text-lg font-medium text-gray-700">
                  {user.profilename}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Email
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={updatedUser?.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              ) : (
                <p className="text-lg font-medium text-gray-700">
                  {user.email}
                </p>
              )}
            </div>

            {/* Business */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Business
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={updatedUser?.business || ""}
                  onChange={(e) =>
                    handleInputChange("business", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              ) : (
                <p className="text-lg font-medium text-gray-700">
                  {user.business}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Phone
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={updatedUser?.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              ) : (
                <p className="text-lg font-medium text-gray-700">
                  {user.phone}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Role
              </label>
              <p className="text-lg font-medium text-gray-700">{user.role}</p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              {editMode ? (
                <>
                  <button
                    onClick={saveChanges}
                    className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
