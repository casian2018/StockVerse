"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CheckSquare,
  User,
  LogOut,
  Briefcase,
  Layers,
  Settings,
  BarChart2,
  Menu,
  X,
  CreditCard,
  Bell,
  MessageCircle,
  Package,
} from "lucide-react";
import { useI18n, supportedLanguages, Locale } from "@/context/I18nContext";

interface SidebarProps {
  role?: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isAdmin = role === "Admin";
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white/80 backdrop-blur-lg rounded-xl shadow-md border border-gray-100 hover:scale-105 transition-all duration-300"
        >
          {isOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="fixed top-0 left-0 w-64 h-full bg-white/90 backdrop-blur-xl shadow-2xl z-40 border-r border-gray-100 flex flex-col"
          >
            {/* Logo Section */}
            <div className="flex items-center justify-center py-6 border-b border-gray-200">
              <a
                href="/dash"
                className="text-2xl font-bold text-gray-800 flex items-center hover:scale-105 transition-all duration-300"
              >
                Stock{" "}
                <span className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-2 py-1 rounded-lg shadow-md">
                  Verse
                </span>
              </a>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col mt-6 px-4 space-y-6 overflow-y-auto scrollbar-hide">
              {/* General Section */}
              <div>
                <h3 className="text-sm uppercase text-gray-400 font-semibold mb-2 px-2">
                  {t("nav.general")}
                </h3>
                <div className="bg-gray-50/80 rounded-2xl shadow-inner py-3 px-2 space-y-2">
                  <SidebarLink href="/dash" icon={<Home />} label={t("nav.dashboard")} />
                  <SidebarLink href="/todo" icon={<CheckSquare />} label={t("nav.tasks")} />
                  <SidebarLink href="/chat" icon={<MessageCircle />} label={t("nav.chat")} />
                  <SidebarLink
                    href="/orders"
                    icon={<Package />}
                    label={t("nav.orders", "Orders")}
                  />
                </div>
              </div>

              {/* Admin Section */}
              {isAdmin && (
                <div>
                  <h3 className="text-sm uppercase text-gray-400 font-semibold mb-2 px-2">
                    {t("nav.adminTools")}
                  </h3>
                  <div className="bg-gray-50/80 rounded-2xl shadow-inner py-3 px-2 space-y-2">
                    <SidebarLink href="/personal" icon={<User />} label={t("nav.personal")} />
                    <SidebarLink href="/stocks" icon={<BarChart2 />} label={t("nav.stocks")} />
                    <SidebarLink href="/accounts" icon={<Layers />} label={t("nav.accounts")} />
                    <SidebarLink
                      href="/automation"
                      icon={<Briefcase />}
                      label={t("nav.automations")}
                    />
                  </div>
                </div>
              )}

              {/* User Section */}
              <div>
                <h3 className="text-sm uppercase text-gray-400 font-semibold mb-2 px-2">
                  {t("nav.account")}
                </h3>
                <div className="bg-gray-50/80 rounded-2xl shadow-inner py-3 px-2 space-y-2">
                  <SidebarLink
                    href="/notifications"
                    icon={<Bell />}
                    label={t("nav.notifications")}
                  />
                  <SidebarLink
                    href="/subscription"
                    icon={<CreditCard />}
                    label={t("nav.subscription")}
                  />
                  <SidebarLink href="/profile" icon={<Settings />} label={t("nav.profile")} />
                  <SidebarLink href="/logout" icon={<LogOut />} label={t("nav.logout")} />
                  <div className="px-2">
                    <label className="text-xs uppercase text-gray-400 font-semibold mb-1 block">
                      {t("language.label")}
                    </label>
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as Locale)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-200"
                    >
                      {supportedLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="py-4 text-center border-t border-gray-200 text-xs text-gray-400">
              © {new Date().getFullYear()} StockVerse
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------
   Reusable Sidebar Link
------------------------- */
function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const router = useRouter();
  const isActive =
    router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl px-4 py-2.5 font-medium transition-all duration-300",
        isActive && "bg-indigo-100 text-indigo-700 shadow-inner"
      )}
    >
      <motion.div
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="text-indigo-500"
      >
        {icon}
      </motion.div>
      {label}
    </Link>
  );
}

function clsx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
