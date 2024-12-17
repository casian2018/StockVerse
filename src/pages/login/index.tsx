"use client";

import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "password" | "setup" | "register">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
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
    <div className="w-screen min-h-screen flex items-center justify-center bg-indigo-50 px-4">
  <div className="py-6 sm:max-w-md w-full">
    <form
      className="px-8 py-10 bg-white rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Step Header */}
      <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
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
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all duration-300"
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
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all duration-300"
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
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="w-full py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-all duration-300"
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
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={profilename}
            onChange={(e) => setProfilename(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Business Name"
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Create a Password"
            className="w-full px-4 py-2 mb-4 border-2 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="w-full py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-all duration-300"
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
          className="text-indigo-600 font-semibold hover:underline"
        >
          Contact Support
        </a>
      </p>
    </form>
  </div>
</div>
  );
}
