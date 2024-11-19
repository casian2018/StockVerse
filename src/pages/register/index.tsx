"use client";

import { useState } from "react";
import router from "next/router";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    profilename: "",
    busniess: "",
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
          busniess: "",
          phone: "",
        });
        router.push("/login");
      } else {
        const errorData = await response.json();
        alert(`Registration failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  return (
    <>
      <div className="w-screen min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="relative py-3 sm:max-w-xs sm:mx-auto">
          <form
            className="min-h-96 px-8 py-6 mt-4 text-left bg-white  rounded-xl shadow-lg"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col justify-center items-center h-full select-none">
              <div className="flex flex-col items-center justify-center gap-2 mb-8">
                <a href="https://amethgalarcio.web.app/" target="_blank">
                  <img
                    src="https://avatars.githubusercontent.com/u/77118609?s=400&u="
                    className="w-8"
                  />
                </a>
                <p className="m-0 text-[16px] font-semibold">
                  Login to your Account
                </p>
                <span className="m-0 text-xs max-w-[90%] text-center text-[#8B8E98]">
                  Get started with our app, just start section and enjoy
                  experience.
                </span>
              </div>
              <div className="w-full flex flex-col gap-2">
                <label className="font-semibold text-xs text-gray-400 ">
                  Email
                </label>
                <input
                    name="email"
                  className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                  placeholder="Email Adress"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-xs text-gray-400 ">
                Name
              </label>
              <input
                name="profilename"
                className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                placeholder="Name"
                value={formData.profilename}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>

            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-xs text-gray-400 ">
                Business
              </label>
              <input
                name="busniess"
                className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                placeholder="Business"
                value={formData.busniess}
                onChange={handleChange}
                required
              />
            </div>

            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-xs text-gray-400 ">
                Phone
              </label>
              <input
                name="phone"
                className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-xs text-gray-400 ">
                Password
              </label>
              <input
                type="password"
                className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                name="password"
                required
              />
            </div>
            <div className="mt-5">
              <button type="submit" className="py-1 px-8 bg-blue-500 hover:bg-blue-800 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
