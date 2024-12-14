"use client";

import { useState } from "react";
import router from "next/router";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    profilename: "",
    business: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("User registered successfully!");
        setFormData({
          email: "",
          password: "",
          profilename: "",
          business: "",
          phone: "",
        });
        router.push("/login");
      } else {
        const errorData = await response.json();
        if (errorData.error === "Business name already exists") {
          alert("A business with this name already exists. Please choose a different name.");
        } else {
          alert(`Registration failed: ${errorData.error}`);
        }
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  return (
    <>
      <div className="w-screen min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="relative py-6 sm:max-w-md w-full">
          {/* Form Container */}
          <form
            className="bg-white px-8 py-8 rounded-2xl shadow-lg transition-all hover:shadow-2xl"
            onSubmit={handleSubmit}
          >
            {/* Header Section */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <a
                href="https://amethgalarcio.web.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://avatars.githubusercontent.com/u/77118609?s=400&u="
                  alt="Logo"
                  className="w-12 h-12 rounded-full shadow-sm"
                />
              </a>
              <h2 className="text-2xl font-bold text-gray-800">
                Create an Account
              </h2>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Start managing your business and join us today!
              </p>
            </div>

            {/* Input Fields */}
            <div className="flex flex-col gap-4 mb-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Name
                </label>
                <input
                  type="text"
                  name="profilename"
                  placeholder="Enter your name"
                  className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  value={formData.profilename}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>

              {/* Business */}
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Business
                </label>
                <input
                  type="text"
                  name="business"
                  placeholder="Your business name"
                  className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  value={formData.business}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <button
                type="submit"
                className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300"
              >
                Register
              </button>
            </div>

            {/* Login Redirect */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-500 hover:underline font-semibold"
              >
                Login here
              </a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
