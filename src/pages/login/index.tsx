"use client";

import { useRouter } from "next/dist/client/components/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/dash");
    } else {
      alert(data.error);
    }
  };
  return (
    <>
      <div className="w-screen min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="relative py-6 sm:max-w-md w-full">
          {/* Login Form */}
          <form
            className="px-8 py-10 bg-white rounded-2xl shadow-xl transform transition-all hover:shadow-2xl"
            onSubmit={handleSubmit}
          >
            {/* Logo and Heading */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <a href="https://amethgalarcio.web.app/" target="_blank">
                <img
                  src="https://avatars.githubusercontent.com/u/77118609?s=400&u="
                  className="w-10 h-10 rounded-full"
                  alt="Logo"
                />
              </a>
              <h2 className="text-2xl font-extrabold text-gray-800">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Get started with our app. Log in to enjoy a seamless experience.
              </p>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1 mb-6">
              <label className="font-semibold text-gray-600 text-xs">
                Email
              </label>
              <input
                type="email"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1 mb-6">
              <label className="font-semibold text-gray-600 text-xs">
                Password
              </label>
              <input
                type="password"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {/* Login Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Login
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center mt-4">
              <p className="text-xs text-gray-600">
                Don’t have an account?{" "}
                <a
                  href="/register"
                  className="text-blue-500 hover:underline transition-all"
                >
                  Register here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
