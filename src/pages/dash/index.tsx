"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { Clock, Users, Briefcase, CreditCard, Bell, PenSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { subscriptionPlanMap } from "@/lib/subscriptionPlans";
import { formatDistanceToNow } from "date-fns";
import type { AutomationAlert } from "@/lib/automations";
import {
  industries,
  industriesMap,
  focusAreas,
  countries,
  type IndustryId,
} from "@/lib/industries";
import { useI18n } from "@/context/I18nContext";

const currencyOptions = Array.from(
  new Set(countries.map((country) => country.currency))
).map((currency) => ({
  currency,
  locale:
    countries.find((country) => country.currency === currency)?.locale ||
    "en-US",
}));

const industryTips: Record<IndustryId | "general", string[]> = {
  retail: [
    "Sync POS exports weekly so barcode scans trigger instant restock automations.",
    "Flag 'Store Ops' as a focus area to unlock shrink + reorder dashboards on the home view.",
  ],
  ecommerce: [
    "Route order-risk automations into chat to alert fulfillment leads in seconds.",
    "Use the shared notebook as a launch calendar and @mention marketing, CX, and ops leads.",
  ],
  it: [
    "Link inventory assets to maintenance tasks so laptops and servers get refresh reminders.",
    "Document incident runbooks in the notebook and @mention responders for instant playbooks.",
  ],
  finance: [
    "Create automations that watch overdue invoices and auto-open tasks for the right rep.",
    "Log audit-ready notes in the notebook and export ICS deadlines straight to client calendars.",
  ],
  manufacturing: [
    "Scan equipment during floor walks so low inventory automatically spins up maintenance tickets.",
    "Set 'Operations excellence' as a focus area to surface throughput and downtime KPIs.",
  ],
  healthcare: [
    "Export the shared calendar feed so shift leads see compliance renewals in Outlook/Google.",
    "Tag notebook sections per department and @mention clinicians when SOPs change.",
  ],
  general: [
    "Start Mondays reviewing unread alerts; convert critical ones into tasks with a click.",
    "Invite managers via Accounts so they can triage chat threads and assign automations.",
  ],
};

export default function Dash() {
  const { user, loading: authLoading, error } = useAuth({
    requireSubscription: true,
  });
  const { t } = useI18n();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alerts, setAlerts] = useState<AutomationAlert[]>([]);
  const [profile, setProfile] = useState<{
    business: string;
    industry: IndustryId | null;
    focusAreas: string[];
    country: string | null;
    currency: string | null;
    locale: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<{
    industry: IndustryId;
    focusAreas: string[];
    country: string;
    currency: string;
    locale: string;
  }>({
    industry: "general",
    focusAreas: [],
    country: "US",
    currency: "USD",
    locale: "en-US",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const currentPlan = user?.subscription?.planId
    ? subscriptionPlanMap[user.subscription.planId]
    : null;
  const hasEnterpriseNotebook = user?.subscription?.planId === "enterprise";
  const subscriptionStatus =
    user?.subscription?.status === "trial"
      ? user.subscription.trialEndsAt
        ? `Trial ends ${formatDistanceToNow(
            new Date(user.subscription.trialEndsAt),
            { addSuffix: true }
          )}`
        : "Trial active"
      : user?.subscription?.status === "active"
      ? "Plan active"
      : "No plan";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch("/api/business/profile");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProfile({
          business: data.business,
          industry: data.industry,
          focusAreas: data.focusAreas || [],
          country: data.country || null,
          currency: data.currency || null,
          locale: data.locale || null,
        });
        if (!data.industry && user.role === "Admin") {
          setShowProfileModal(true);
        }
      } catch {
        setProfile({
          business: user.business || "",
          industry: null,
          focusAreas: [],
          country: null,
          currency: null,
          locale: null,
        });
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        industry: (profile.industry as IndustryId) || "general",
        focusAreas: profile.focusAreas || [],
        country: profile.country || "US",
        currency: profile.currency || "USD",
        locale: profile.locale || "en-US",
      });
    }
  }, [profile]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/business/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile({
        business: data.business,
        industry: data.industry,
        focusAreas: data.focusAreas || [],
        country: data.country || null,
        currency: data.currency || null,
        locale: data.locale || null,
      });
      setShowProfileModal(false);
    } catch {
      // eslint-disable-next-line no-alert
      alert("Unable to save business preferences. Try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/automations/alerts");
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data);
      } catch {
        /* noop */
      }
    };
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const acknowledgeAlert = async (id?: string) => {
    if (!id) return;
    await fetch("/api/automations/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id }),
    });
    setAlerts((prev) => prev.filter((a) => a._id !== id));
  };

  if (authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-xl font-semibold">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-xl font-semibold">
        {error}
      </div>
    );
  }

  const selectedIndustry =
    (profile?.industry && industriesMap[profile.industry as IndustryId]) ||
    industriesMap.general;
  const selectedCountry = countries.find(
    (country) => country.code === (profile?.country || profileForm.country)
  );
  const selectedFocus = focusAreas.filter((f) =>
    profile?.focusAreas?.includes(f.id)
  );
  const activeTips =
    (profile?.industry &&
      industryTips[profile.industry as IndustryId] &&
      industryTips[profile.industry as IndustryId].length
      ? industryTips[profile.industry as IndustryId]
      : industryTips.general) || industryTips.general;

  useEffect(() => {
    setTipIndex(0);
  }, [profile?.industry]);

  return (
    <>
      <Sidebar role={user?.role} />
      <main className="md:ml-64 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden px-4 sm:px-8 md:px-10 pt-24 md:pt-0">
        {/* Animated background blobs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-20 left-10 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"
        />

        {/* Main Content */}
        <div className="relative z-10 py-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-8"
          >
            Welcome Back, {user?.role === "Admin" ? "Admin" : user?.profilename || "User"}
          </motion.h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Welcome Card */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-700">Welcome</h2>
                <Clock className="text-indigo-500 w-6 h-6" />
              </div>
              <p className="text-5xl font-extrabold text-indigo-600 mt-4 mb-2">
                {user?.profilename || "Guest"}
              </p>
              <p className="text-gray-500 text-lg">
                {currentTime.toLocaleTimeString(
                  profile?.locale || user?.locale || undefined,
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </p>
            </motion.div>

            {/* Personal Card */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white rounded-3xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Personal</h2>
                <Users className="w-6 h-6" />
              </div>
              <p className="text-5xl font-extrabold mt-4 mb-6">
                {user?.personal?.length || 0}
              </p>
              <a
                href="/personal"
                className="inline-block bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-lg font-semibold transition"
              >
                See Details
              </a>
            </motion.div>

            {/* Business Card */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-500 text-white rounded-3xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Business</h2>
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-4xl font-bold mt-4 mb-2">{user?.business || "N/A"}</p>
              <p className="text-white/80">{user?.email}</p>
            </motion.div>
          </div>

          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10 bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <p className="text-sm uppercase text-gray-400 tracking-wide">
                Subscription
              </p>
              <div className="flex items-center gap-3 mt-2">
                <CreditCard className="text-indigo-500 w-6 h-6" />
                <div>
                  <h3 className="text-xl font-semibold">
                    {currentPlan ? currentPlan.name : "No plan selected"}
                  </h3>
                  <p className="text-sm text-gray-500">{subscriptionStatus}</p>
                </div>
              </div>
            </div>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm font-semibold shadow hover:scale-[1.02] transition"
            >
              Manage plan
            </Link>
          </motion.div>

          {user?.role === "Admin" && hasEnterpriseNotebook && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-6 bg-gradient-to-r from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-3xl shadow p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-inner">
                  <PenSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase text-indigo-500 font-semibold">
                    Enterprise exclusive
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Collaborative notebook unlocked
                  </h3>
                  <p className="text-sm text-gray-500">
                    Capture org-wide notes, @mention teammates, and share status
                    updates without leaving StockVerse.
                  </p>
                </div>
              </div>
              <Link
                href="/notes"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold shadow hover:scale-[1.02] transition"
              >
                Open workspace
              </Link>
            </motion.div>
          )}

          {!profileLoading && profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-6 bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col gap-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-400 font-semibold">
                    {t("dashboard.industryPlaybook")}
                  </p>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedIndustry.name}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedIndustry.tagline}</p>
                </div>
                {user?.role === "Admin" && (
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
                  >
                    {t("dashboard.adjustPreferences")}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                    {t("dashboard.focusAreas")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFocus.length === 0 && (
                      <span className="text-xs text-gray-500">
                        {t("dashboard.focusAreasEmpty")}
                      </span>
                    )}
                    {selectedFocus.map((focus) => (
                      <span
                        key={focus.id}
                        className="px-3 py-1 rounded-full bg-white text-indigo-600 text-xs font-semibold shadow"
                      >
                        {focus.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t("dashboard.recommendedModules")}
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    {selectedIndustry.recommendedModules.map((module) => (
                      <li key={module} className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                        {module === "stocks" && "Inventory & asset tracking"}
                        {module === "tasks" && "Tasks & shared calendars"}
                        {module === "automations" && "Automations & alerts"}
                        {module === "chat" && "Chat & collaboration"}
                        {module === "notes" && "Shared notebook"}
                        {module === "analytics" && "Analytics dashboards"}
                        {module === "chat" || module === "stocks" || module === "tasks" || module === "automations" || module === "notes" || module === "analytics" ? null : module}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {selectedIndustry.description}
                {profile?.country && selectedCountry && (
                  <>
                    {" "}
                    Operating in <strong>{selectedCountry.label}</strong> (
                    {selectedCountry.currency}). Pricing, time, and currency
                    defaults reflect this locale.
                  </>
                )}
              </p>
            </motion.div>
          )}

          {activeTips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-6 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-3xl shadow-xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/70 font-semibold">
                    Pro tip
                  </p>
                  <h3 className="text-xl font-semibold">
                    Make the most of {selectedIndustry.name}
                  </h3>
                </div>
                <button
                  onClick={() =>
                    setTipIndex((prev) => (prev + 1) % activeTips.length)
                  }
                  className="px-4 py-2 rounded-full border border-white/40 text-sm font-semibold hover:bg-white/10 transition"
                >
                  Next tip
                </button>
              </div>
              <p className="text-base text-white/90">
                {activeTips[tipIndex % activeTips.length]}
              </p>
            </motion.div>
          )}

          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-6 bg-white/80 backdrop-blur border border-amber-100 rounded-3xl shadow p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Bell className="text-amber-500 w-5 h-5" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Automation alerts
                  </h3>
                </div>
                <Link
                  href="/notifications"
                  className="text-sm font-semibold text-amber-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert._id ?? alert.automationId}
                    className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 flex flex-col gap-2"
                  >
                    <p className="text-sm text-gray-800">{alert.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(alert.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <button
                        onClick={() => acknowledgeAlert(alert._id)}
                        className="text-amber-600 font-semibold disabled:text-amber-300"
                        disabled={!alert._id}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center text-gray-400 text-sm mt-12"
          >
            © {new Date().getFullYear()} StockVerse. Crafted with 💙 for data-driven success.
          </motion.div>
        </div>
        </main>

      {user?.role === "Admin" && showProfileModal && (
        <IndustryModal
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          onClose={() => setShowProfileModal(false)}
          onSave={saveProfile}
          saving={savingProfile}
          allowDismiss={Boolean(profile?.industry)}
        />
      )}
      </>
  );

}

interface IndustryModalProps {
  profileForm: {
    industry: IndustryId;
    focusAreas: string[];
    country: string;
    currency: string;
    locale: string;
  };
  setProfileForm: React.Dispatch<
    React.SetStateAction<{
      industry: IndustryId;
      focusAreas: string[];
      country: string;
      currency: string;
      locale: string;
    }>
  >;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  allowDismiss: boolean;
}

function IndustryModal({
  profileForm,
  setProfileForm,
  onClose,
  onSave,
  saving,
  allowDismiss,
}: IndustryModalProps) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold">
              {t("dashboard.industryPlaybook")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("dashboard.modal.title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("dashboard.modal.subtitle")}
            </p>
            {!allowDismiss && (
              <p className="text-xs text-amber-600 mt-2">
                {t("dashboard.modal.requiredNote")}
              </p>
            )}
          </div>
          {allowDismiss && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-gray-300"
            >
              {t("actions.cancel")}
            </button>
          )}
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {t("dashboard.modal.chooseIndustry")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() =>
                    setProfileForm((prev) => ({ ...prev, industry: industry.id }))
                  }
                  className={`text-left rounded-2xl border p-4 transition ${
                    profileForm.industry === industry.id
                      ? "border-indigo-300 bg-indigo-50/60"
                      : "border-gray-200 hover:border-indigo-200"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{industry.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{industry.tagline}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {t("dashboard.modal.focusAreas")}
            </p>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((focus) => {
                const selected = profileForm.focusAreas.includes(focus.id);
                return (
                  <button
                    key={focus.id}
                    onClick={() =>
                      setProfileForm((prev) => {
                        const exists = prev.focusAreas.includes(focus.id);
                        return {
                          ...prev,
                          focusAreas: exists
                            ? prev.focusAreas.filter((id) => id !== focus.id)
                            : [...prev.focusAreas, focus.id],
                        };
                      })
                    }
                    className={`px-3 py-1.5 rounded-full border text-sm transition ${
                      selected
                        ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                        : "border-gray-200 text-gray-600 hover:border-indigo-200"
                    }`}
                  >
                    {focus.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {t("dashboard.modal.region")}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {t("dashboard.modal.regionHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">
                  Country / Region
                </label>
                <input
                  list="country-options"
                  value={profileForm.country}
                  onChange={(e) => {
                    const value = e.target.value;
                    const match = countries.find(
                      (country) =>
                        country.code.toLowerCase() === value.toLowerCase() ||
                        country.label.toLowerCase() === value.toLowerCase()
                    );
                    if (match) {
                      setProfileForm((prev) => ({
                        ...prev,
                        country: match.code,
                        currency: match.currency,
                        locale: match.locale,
                      }));
                    } else {
                      setProfileForm((prev) => ({
                        ...prev,
                        country: value,
                      }));
                    }
                  }}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. United States"
                />
                <datalist id="country-options">
                  {countries.map((country) => (
                    <option key={country.code} value={country.label} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">
                  Currency
                </label>
                <input
                  list="currency-options"
                  value={profileForm.currency}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    const option =
                      currencyOptions.find((c) => c.currency === value) || null;
                    setProfileForm((prev) => ({
                      ...prev,
                      currency: value,
                      locale: option ? option.locale : prev.locale,
                    }));
                  }}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. USD"
                />
                <datalist id="currency-options">
                  {currencyOptions.map((option) => (
                    <option key={option.currency} value={option.currency} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {allowDismiss && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300"
            >
              {t("dashboard.modal.dismiss")}
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold shadow disabled:opacity-50"
          >
            {saving ? t("actions.save") : t("dashboard.modal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
