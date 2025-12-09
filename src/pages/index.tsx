"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  subscriptionPlans,
  SubscriptionPlanId,
} from "@/lib/subscriptionPlans";

export default function StockVerseLanding() {
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlanId>("pro");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const features = [
    {
      title: "Industry playbooks",
      desc: "Retail, IT, finance, or healthcare—you get tailored dashboards, KPIs, and automations with zero setup.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      ),
    },
    {
      title: "Ops-grade automation",
      desc: "Route alerts to chat, email, Slack/Teams, or webhooks based on KPIs, inventory, or compliance events.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      title: "Unified workspace",
      desc: "Tasks, inventory, notes, chat, and analytics live together so every team stays accountable in real time.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4zM4 10h16M10 4v16" />
        </svg>
      ),
    },
  ];

  const pageCollections = [
    {
      title: "Workspace",
      links: [
        { label: "Dashboard", href: "/dash", description: "See KPIs, alerts, and shortcuts." },
        { label: "Tasks", href: "/todo", description: "Plan sprints and personal to-dos." },
        { label: "Chat", href: "/chat", description: "Message teammates in real time." },
        { label: "Notes", href: "/notes", description: "Shared notebook for the whole org." },
      ],
    },
    {
      title: "Operations",
      links: [
        { label: "Stocks", href: "/stocks", description: "Inventory & asset controls." },
        { label: "Accounts", href: "/accounts", description: "Manage seats and roles." },
        { label: "Personal", href: "/personal", description: "People records & HR data." },
        { label: "Orders", href: "/orders", description: "Creative orders & approvals." },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Profile", href: "/profile", description: "Your contact + business info." },
        { label: "Notifications", href: "/notifications", description: "Alert center & history." },
        { label: "Subscription", href: "/subscription", description: "Billing + plan details." },
        { label: "Login", href: "/login", description: "Secure portal access." },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact", href: "/contact", description: "Talk with sales or support." },
        { label: "Register", href: "/register", description: "Spin up a workspace." },
        { label: "Docs", href: "#features", description: "Product overview & specs." },
        { label: "Pricing", href: "#pricing", description: "Compare plans in detail." },
      ],
    },
  ];

  return (
    <div className="font-inter antialiased text-gray-800 bg-gradient-to-b from-white to-gray-50">
      {/* NAV */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur bg-white/60 border border-white/40 rounded-2xl p-3 shadow-md">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div className="text-lg font-bold">Stock<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Verse</span></div>
              <div className="text-xs text-gray-500 -mt-0.5">One HQ for operations, inventory, and collaboration</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              
              <div className="absolute right-0 mt-3 hidden group-hover:block">
                <div className="w-[560px] rounded-3xl border border-gray-100 bg-white/95 shadow-2xl p-5">
                  <div className="grid grid-cols-2 gap-6">
                    {pageCollections.map((section) => (
                      <div key={section.title}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {section.title}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {section.links.map((link) => (
                            <li key={link.label}>
                              <Link
                                href={link.href}
                                className="block rounded-2xl px-3 py-2 hover:bg-gray-50"
                              >
                                <div className="text-sm font-semibold text-gray-800">
                                  {link.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {link.description}
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Link href="#features" className="text-sm text-gray-700 hover:text-gray-900">Features</Link>
            <Link href="#pricing" className="text-sm text-gray-700 hover:text-gray-900">Pricing</Link>
            <Link href="#contact" className="text-sm text-gray-700 hover:text-gray-900">Contact</Link>
            <Link href="/login" className="ml-2 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:scale-[1.02] transition-transform">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="pt-28 pb-20 relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Decorative shapes */}
        <div className="absolute -left-40 -top-40 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl mix-blend-normal animate-blob1 -z-10"></div>
        <div className="absolute right-[-120px] top-20 w-80 h-80 rounded-full bg-purple-100/50 blur-3xl animate-blob2 -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col-reverse lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}} className="text-4xl md:text-6xl font-extrabold leading-tight">
              Run operations, inventory, and teams from <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">one HQ</span>
            </motion.h1>

            <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.15}} className="mt-6 text-lg text-gray-600">
              StockVerse is the unified operations workspace: inventory, tasks, automations, chat, notes and analytics tailored to your industry. Start with playbooks, automate the rest, and give every team a single place to act.
            </motion.p>

            <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:scale-[1.02] transition-transform">
                Create your free workspace
                <span className="text-sm opacity-80">— no card required</span>
              </Link>

              <a href="#pricing" className="text-sm text-gray-700 hover:underline">See plans & pricing</a>
            </motion.div>

            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.45}} className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold">Playbooks, not blank slates</div>
                  <div className="text-xs text-gray-500">Industry templates to get started fast</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h3l3 8 4-16 3 12 4-8h2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold">Enterprise-grade security</div>
                  <div className="text-xs text-gray-500">Encryption, SSO, and audit controls</div>
                </div>
              </div>
            </motion.div>

              <div className="mt-10 flex gap-6 items-center">
                <div className="text-sm text-gray-500">Rated 4.8 / 5 by operators</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.385 2.462a1 1 0 00-.364 1.118l1.286 3.966c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.385 2.462c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.612 9.393c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z"/></svg>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Animated dashboard mock */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{duration:0.6}} className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-2xl w-full max-w-xl">
              <div className="absolute -top-6 left-6 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-3 py-1 rounded-full text-xs shadow">Live</div>

              {/* Tiny nav */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100" />
                  <div>
                    <div className="text-sm font-semibold">My Portfolio</div>
                    <div className="text-xs text-gray-400">Updated seconds ago</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">USD</div>
              </div>

              {/* Chart (animated SVG) */}
              <div className="w-full h-48">
                <svg viewBox="0 0 600 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0" stopColor="#60a5fa" />
                      <stop offset="1" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>

                  <motion.path
                    d="M0 140 C60 120 120 80 180 100 C240 120 300 60 360 80 C420 100 480 50 540 70 C600 90 660 40 720 60"
                    fill="none"
                    stroke="url(#g1)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                  />

                  {/* small points */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.circle key={i} cx={60 + i * 96} cy={120 - (i % 3) * 20} r="4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.08 }} />
                  ))}
                </svg>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Total value</div>
                  <div className="text-xl font-semibold">$12,483.23</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-semibold">+3.8% </div>
                  <div className="text-xs text-gray-400">vs 24h</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center">Built for every industry — launch with playbooks</h2>
          <p className="text-center text-gray-600 mt-3">Tailored dashboards, automations, and modules so teams can focus on outcomes, not integrations.</p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, idx) => (
              <motion.div key={f.title} className="p-6 bg-white rounded-2xl shadow hover:shadow-xl transition" initial={{opacity:0, y:12}} whileInView={{opacity:1, y:0}} transition={{delay:0.12 * idx}}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">{f.icon}</div>
                  <div>
                    <div className="font-semibold text-lg">{f.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{f.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">Plans for teams of all sizes</h2>
            <p className="text-gray-600 mt-2">From solo operators to enterprise orgs — pricing that scales with usage and features.</p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              <button className={`px-4 py-1 rounded-full text-sm ${selectedPlan === "basic" ? "bg-blue-600 text-white" : "text-gray-600"}`} onClick={() => setSelectedPlan("basic")}>Basic</button>
              <button className={`px-4 py-1 rounded-full text-sm ${selectedPlan === "pro" ? "bg-blue-600 text-white" : "text-gray-600"}`} onClick={() => setSelectedPlan("pro")}>Pro</button>
              <button className={`px-4 py-1 rounded-full text-sm ${selectedPlan === "enterprise" ? "bg-blue-600 text-white" : "text-gray-600"}`} onClick={() => setSelectedPlan("enterprise")}>Enterprise</button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((p) => (
              <motion.div key={p.id} className={`p-6 rounded-2xl border ${selectedPlan === p.id ? "border-blue-200 shadow-2xl scale-[1.02]" : "border-gray-100 shadow"} bg-white transition-transform`} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{duration:0.4}}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.tag}</div>
                  </div>
                  {selectedPlan === p.id && <div className="text-sm text-blue-600 font-semibold">Recommended</div>}
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <div className="text-3xl md:text-4xl font-extrabold">
                    ${p.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">{p.billingPeriod}</div>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2">
                  <Link
                    href={`/subscription?plan=${p.id}`}
                    className="block text-center px-4 py-3 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                  >
                    Start {p.name} trial — ${p.price.toFixed(2)}/mo
                  </Link>
                  {p.id === "enterprise" && (
                    <Link
                      href="/contact"
                      className="block text-center px-4 py-3 text-sm rounded-lg text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                    >
                      Talk to sales
                    </Link>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-400 text-center">
                  14-day free trial. Cancel anytime.
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">All prices billed monthly. Taxes may apply.</div>
        </div>
      </section>

      {/* TESTIMONIALS + FAQ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-extrabold">Why teams choose StockVerse</h3>
            <p className="text-gray-600 mt-2">Operations teams, store managers, and IT leaders use StockVerse to replace scattered tools with one reliable HQ.</p>

            <div className="mt-6 space-y-4">
              {[
                { name: "Alex M.", text: "StockVerse simplified our daily ops. We reduced stockouts and freed time for strategy.", img: "https://i.pravatar.cc/100?img=12"},
                { name: "Sarah W.", text: "Automations and shared notes keep our teams aligned across locations.", img: "https://i.pravatar.cc/100?img=25"},
              ].map((t, i) => (
                <motion.div key={i} className="p-4 bg-white rounded-2xl shadow" initial={{opacity:0, y:12}} whileInView={{opacity:1, y:0}} transition={{delay:i*0.12}}>
                  <div className="flex items-start gap-4">
                    <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full"/>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{t.text}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold">Frequently asked questions</h3>
            <div className="mt-4 space-y-3">
              {[
                { q: "Can I cancel anytime?", a: "Yes — monthly plans can be cancelled at any time with no penalties." },
                { q: "Do you provide API access?", a: "API & integrations are available on Pro and Enterprise plans. Enterprise includes dedicated endpoints." },
                { q: "Is my data secure?", a: "We use end-to-end encryption, SOC-compliant processes and optional SSO for teams." },
              ].map((fq, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-4">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full text-left flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{fq.q}</div>
                      <div className="text-xs text-gray-500 mt-1">Click to {faqOpen === i ? "collapse" : "expand"}</div>
                    </div>
                    <div className="text-gray-400">{faqOpen === i ? "—" : "+"}</div>
                  </button>

                  {faqOpen === i && <div className="mt-3 text-sm text-gray-600">{fq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h3 initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} className="text-3xl md:text-4xl font-extrabold">Ready to run your business from one HQ?</motion.h3>
          <motion.p initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.12}} className="mt-3 text-gray-100">Create a free workspace and see industry playbooks, automations, and collaboration in action.</motion.p>

          <div className="mt-6 flex justify-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-3 bg-white text-blue-700 px-6 py-3 rounded-full font-semibold shadow hover:scale-[1.02] transition-transform">Create free workspace</Link>
            <Link href="/contact" className="inline-flex items-center gap-3 border border-white/30 px-6 py-3 rounded-full text-white">Contact sales</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="py-14 bg-gray-50/80 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-bold">StockVerse</div>
            <div className="text-sm text-gray-500 mt-2">
              Power operations, not just data—one workspace for teams, inventory, and automation.
            </div>
          </div>
          {pageCollections.map((section) => (
            <div key={`footer-${section.title}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {section.title}
              </p>
              <ul className="mt-3 space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-indigo-600 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} StockVerse — All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-gray-600">Terms</a>
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#features" className="hover:text-gray-600">Product docs</a>
          </div>
        </div>
      </footer>

      {/* Small styles for blob animation (tailwind plugin would be better, but inline here) */}
      <style jsx>{`
        @keyframes blob1 { 0% { transform: translate(0,0) scale(1)} 33% { transform: translate(10px, -20px) scale(1.05)} 66% { transform: translate(-10px, 10px) scale(0.95)} 100% { transform: translate(0,0) scale(1)} }
        @keyframes blob2 { 0% { transform: translate(0,0) scale(1)} 33% { transform: translate(-10px, 20px) scale(1.05)} 66% { transform: translate(10px, -10px) scale(0.95)} 100% { transform: translate(0,0) scale(1)} }
        .animate-blob1 { animation: blob1 8s infinite; }
        .animate-blob2 { animation: blob2 7.5s infinite; }
      `}</style>
    </div>
  );
}
