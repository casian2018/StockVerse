"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "password" | "setup" | "register">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilename, setProfilename] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");

  const router = useRouter();

  // Handle Email Check
  const checkEmail = async () => {
    const res = await fetch("/api/checkEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (data.exists) {
      if (data.hasPassword) {
        setStep("password");
      } else {
        setStep("setup");
      }
    } else {
      setStep("register");
    }
  };

  // Handle Login
  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/dash");
    } else {
      alert("Invalid credentials!");
    }
  };

  // Handle Password Setup
  const handleSetupPassword = async () => {
    const res = await fetch("/api/setupPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      alert("Password set successfully!");
      setStep("password");
    } else {
      alert("Failed to set password.");
    }
  };

  // Handle Registration
  const handleRegister = async () => {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        profilename,
        business,
        phone,
      }),
    });

    if (res.ok) {
      alert("Registration successful!");
      setStep("password");
    } else {
      alert("Registration failed!");
    }
  };

  return (
    <div className="relative w-screen min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      {/* Animated Background Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-10 left-10 w-64 h-64 bg-blue-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-300 rounded-full blur-3xl"
      />

      {/* Main Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="py-8 sm:max-w-md w-full px-6 relative z-10"
      >
        <motion.form
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className="px-8 py-10 bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-2xl"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Step Header */}
          <h2 className="text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            {step === "email"
              ? "Welcome Back!"
              : step === "password"
              ? "Login"
              : step === "setup"
              ? "Set Up Your Password"
              : "Register Your Account"}
          </h2>
          <p className="text-center text-gray-500 mb-6">
            {step === "register"
              ? "Get started with your business today!"
              : "Please fill in the required details"}
          </p>

          {/* Email Step */}
          {step === "email" && (
            <>
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                onClick={checkEmail}
              >
                Next
              </button>
            </>
          )}

          {/* Password Step */}
          {step === "password" && (
            <>
              <input
                type="password"
                placeholder="Your Password"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                onClick={handleLogin}
              >
                Login
              </button>
            </>
          )}

          {/* Password Setup */}
          {step === "setup" && (
            <>
              <input
                type="password"
                placeholder="Set Password"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                onClick={handleSetupPassword}
              >
                Set Password
              </button>
            </>
          )}

          {/* Register Step */}
          {step === "register" && (
            <>
              <input
                type="text"
                placeholder="Profile Name"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={profilename}
                onChange={(e) => setProfilename(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Business Name"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Phone"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Create a Password"
                className="w-full px-4 py-3 mb-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                onClick={handleRegister}
              >
                Register
              </button>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Need help?{" "}
            <a
              href="#"
              className="text-blue-600 font-semibold hover:underline hover:text-indigo-600 transition"
            >
              Contact Support
            </a>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}