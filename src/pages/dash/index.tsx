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
        <main className="w-full md:w-[calc(100%-256px)] md:ml-64 bg-gray-200 min-h-screen transition-all">
          <div className="p-6">
            <h1 className="text-2xl font-semibold py-4">Admin Panel</h1>
            <div className="flex flex-row">
              <div className="bg-no-repeat bg-red-200 border border-red-300 rounded-xl w-7/12 mr-2 p-6">
                <p className="text-5xl text-indigo-900">
                  Welcome <br />
                  <strong>{user?.profilename || 'Guest'}</strong>
                </p>
                <span className="bg-red-300 text-xl text-white inline-block rounded-full mt-12 px-8 py-2">
                  <strong>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </span>
              </div>
              <div className="bg-no-repeat bg-orange-200 border border-orange-300 rounded-xl w-5/12 ml-2 p-6">
                <p className="text-5xl text-indigo-900">
                  Personal <br />
                    <strong>{user?.personal?.length || 0}</strong>
                </p>
                <a href="/personal" className="bg-orange-300 text-xl text-white underline hover:no-underline inline-block rounded-full mt-12 px-8 py-2">
                  <strong>See Personal</strong>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
