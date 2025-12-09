"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus('Message sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('Failed to send message.');
      }
    } catch (error) {
      setStatus('Error sending message.');
    }
  };

  return (
    <div className="font-inter text-gray-800 bg-white min-h-screen selection:bg-blue-100 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-[99] backdrop-blur-xl bg-white/70 border-b border-gray-100 py-4 px-8 flex justify-between items-center shadow-sm">
        <Link href="/" className="text-2xl font-bold text-gray-800 flex items-center">
          Stock
          <span className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-2 py-1 rounded-lg shadow-sm">
            Verse
          </span>
        </Link>
        <Link href="/login" className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all">
          Get Started
        </Link>
      </nav>

      {/* Contact Section */}
      <section className="pt-32 pb-24 relative bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-10 left-0 w-80 h-80 bg-blue-200/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-indigo-200/40 rounded-full blur-[140px] animate-pulse"></div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-extrabold text-center text-gray-900 mb-8"
          >
            Get in <span className="text-blue-600">Touch</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg text-center text-gray-600 max-w-2xl mx-auto mb-16"
          >
            Have questions about StockVerse, pricing, or partnerships? Our team is here to help.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Contact Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white shadow-xl rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2 font-medium">Message</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How can we help you?"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300"
              >
                Send Message
              </button>
              {status && <p className="mt-4 text-center text-sm">{status}</p>}
            </motion.form>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h3>
                <p className="text-gray-600 mb-2">Email us directly or visit our offices at any time.</p>
              </div>
              <div className="space-y-4 text-gray-700">
                <p><strong>Email:</strong> support@stockverse.com</p>
                <p><strong>Phone:</strong> +1 (800) 555-0199</p>
                <p><strong>Address:</strong> 123 Market St, San Francisco, CA</p>
              </div>
              <div className="flex space-x-4 mt-6">
                {['Instagram', 'LinkedIn', 'Twitter'].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="text-gray-500 hover:text-blue-600 transition text-lg"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-bold mb-3">StockVerse</h4>
            <p className="text-gray-400">Smarter stock management for modern investors.</p>
          </div>
          <div>
            <h5 className="text-lg font-semibold mb-3 text-gray-200">Follow Us</h5>
            <ul className="flex space-x-5 text-gray-400">
              {['Instagram', 'LinkedIn', 'Twitter'].map((s) => (
                <li key={s}>
                  <a href="#" className="hover:text-blue-400 transition">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center mt-8 text-gray-500 text-sm">
          © {new Date().getFullYear()} StockVerse. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}