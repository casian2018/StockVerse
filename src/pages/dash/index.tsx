"use client";

import { useEffect, useState, useId } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";

interface User {
  profilename: string;
  email: string;
  business: string;
  role: string;
  personal: string[];
}

export default function Dash() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Clean up the interval on component unmount
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

useEffect(() => {
    const fetchUserData = async () => {
        try {
            const response = await fetch("/api/getUserInfo", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies in the request
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const userData = await response.json();
            setUser(userData);
        } catch (err) {
            setError("Failed to fetch user data");
        } finally {
            setLoading(false);
        }
    };

    fetchUserData();
}, []);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500 font-semibold">{error}</p>;

  return (
    <>
      <Sidebar />
      <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-40">
      <main className="ml-64 bg-gray-50 min-h-screen transition-all">
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome Back, Admin</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-8 shadow-md">
          <h2 className="text-3xl font-bold mb-4">Welcome,</h2>
          <p className="text-5xl mb-6">
            <strong>{user?.profilename || "Guest"}</strong>
          </p>
          <div className="inline-block bg-white/20 px-6 py-2 rounded-full">
            <span className="text-lg font-semibold">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Personal Section */}
        <div className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white rounded-lg p-8 shadow-md">
          <h2 className="text-3xl font-bold mb-4">Personal</h2>
          <p className="text-5xl font-bold mb-6">{user?.personal?.length || 0}</p>
          <a
            href="/personal"
            className="inline-block bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-lg font-semibold transition"
          >
            See Details
          </a>
        </div>
      </div>
    </div>
  </main>
      </div>
    </>
  );
}
