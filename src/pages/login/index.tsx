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
      <div className="w-screen min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="relative py-3 sm:max-w-xs sm:mx-auto">
          <form className="min-h-96 px-8 py-6 mt-4 text-left bg-white  rounded-xl shadow-lg" onSubmit={handleSubmit}>
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
                  className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                  placeholder="Email Adress"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-xs text-gray-400 ">
                Password
              </label>
              <input
                type="password"
                className="border rounded-lg px-3 py-2 mb-5 text-sm w-full outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="mt-5">
              <button className="py-1 px-8 bg-blue-500 hover:bg-blue-800 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none">
                Login
              </button>
            </div>
            <a href="/register" className="text-xs text-blue-500 hover:underline">You don't have an account ?</a>
          </form>
        </div>
      </div>
    </>
  );
}
