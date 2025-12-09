"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  subscriptionPlans,
  subscriptionPlanMap,
  SubscriptionPlanId,
  TRIAL_LENGTH_DAYS,
} from "@/lib/subscriptionPlans";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/router";

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function SubscriptionPage() {
  const { user, loading, error, refresh } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlanId>("pro");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const paypalButtonsRef = useRef<any>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!router.isReady) return;
    const planQuery = router.query.plan;
    if (
      typeof planQuery === "string" &&
      subscriptionPlanMap[planQuery as SubscriptionPlanId]
    ) {
      setSelectedPlan(planQuery as SubscriptionPlanId);
    }
  }, [router.isReady, router.query.plan]);

  useEffect(() => {
    if (!clientId) {
      setPaypalError(
        "PayPal client ID missing. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID."
      );
      return;
    }

    if (typeof window === "undefined") return;
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () =>
      setPaypalError("Unable to load PayPal. Please refresh.");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [clientId]);

  useEffect(() => {
    if (
      !paypalReady ||
      !paypalContainerRef.current ||
      typeof window === "undefined" ||
      !window.paypal
    ) {
      return;
    }

    if (paypalButtonsRef.current) {
      paypalButtonsRef.current.close?.();
      paypalButtonsRef.current = null;
    }

    paypalButtonsRef.current = window.paypal.Buttons({
      style: { shape: "pill", color: "blue" },
      createOrder: async () => {
        setPaypalError(null);
        const response = await fetch("/api/subscription/createOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlan }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to create PayPal order");
        }
        return data.orderId;
      },
      onApprove: async (data: any) => {
        const response = await fetch("/api/subscription/captureOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlan, orderId: data.orderID }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to activate subscription");
        }
        setStatusMessage("Subscription activated successfully.");
        await refresh();
      },
      onError: (err: any) => {
        console.error("PayPal error", err);
        setPaypalError("Payment failed. Please try again.");
      },
    });

    paypalButtonsRef.current.render(paypalContainerRef.current);

    return () => {
      if (paypalButtonsRef.current) {
        paypalButtonsRef.current.close?.();
        paypalButtonsRef.current = null;
      }
    };
  }, [paypalReady, selectedPlan, refresh]);

  const currentSubscription = user?.subscription;
  const currentPlan = currentSubscription?.planId
    ? subscriptionPlanMap[currentSubscription.planId]
    : null;

  const trialActive = Boolean(
    currentSubscription?.status === "trial" &&
      currentSubscription.trialEndsAt &&
      new Date(currentSubscription.trialEndsAt) > new Date()
  );
  const trialEligible = !(currentSubscription?.trialUsed ?? false);

  const startTrial = async () => {
    setStatusMessage(null);
    setPaypalError(null);
    try {
      const response = await fetch("/api/subscription/startTrial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to start trial");
      }
      setStatusMessage("Trial activated. Enjoy StockVerse!");
      await refresh();
    } catch (err) {
      setPaypalError(err instanceof Error ? err.message : "Trial failed");
    }
  };

  const subscriptionStatusLabel = useMemo(() => {
    if (!currentSubscription) return "No plan";
    if (currentSubscription.status === "trial") {
      if (trialActive && currentSubscription.trialEndsAt) {
        return `Trial ends in ${formatDistanceToNow(
          new Date(currentSubscription.trialEndsAt),
          { addSuffix: true }
        )}`;
      }
      return "Trial expired";
    }
    if (currentSubscription.status === "active" && currentPlan) {
      return `${currentPlan.name} plan active`;
    }
    return "Inactive";
  }, [currentSubscription, currentPlan, trialActive]);

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading subscription...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user?.role} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-24 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-16 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 md:pt-10 pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6"
        >
          Manage Subscription
        </motion.h1>
        <p className="text-gray-600 mb-8">
          Choose the plan that fits your business. Every account includes a{" "}
          {TRIAL_LENGTH_DAYS}-day free trial.
        </p>

        {statusMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">
            {statusMessage}
          </div>
        )}
        {paypalError && (
          <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-600 text-sm">
            {paypalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`text-left p-6 rounded-2xl border transition-all ${
                selectedPlan === plan.id
                  ? "border-indigo-400 shadow-2xl bg-white"
                  : "border-gray-200 bg-white/80 hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{plan.name}</div>
                  <div className="text-xs text-gray-400">{plan.tag}</div>
                </div>
                {selectedPlan === plan.id && (
                  <span className="text-xs font-semibold text-indigo-600">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <div className="text-3xl font-extrabold">
                  ${plan.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {plan.billingPeriod}
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase text-gray-400 tracking-wide">
                  Current status
                </p>
                <h3 className="text-2xl font-semibold mt-1">
                  {currentPlan ? currentPlan.name : "No plan selected"}
                </h3>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                {currentSubscription?.status ?? "inactive"}
              </span>
            </div>
            <p className="text-gray-600 mt-4">{subscriptionStatusLabel}</p>
            {currentSubscription?.lastPaidAt && (
              <p className="text-xs text-gray-400 mt-2">
                Last paid{" "}
                {formatDistanceToNow(new Date(currentSubscription.lastPaidAt), {
                  addSuffix: true,
                })}
              </p>
            )}
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Need something custom?{" "}
                <a
                  href="/contact"
                  className="text-indigo-600 font-semibold underline"
                >
                  Contact sales
                </a>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6"
          >
            <h3 className="text-xl font-semibold">Activate {selectedPlan}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Start with a free trial or subscribe securely using PayPal.
            </p>

            <button
              onClick={startTrial}
              disabled={!trialEligible || trialActive}
              className={`mt-4 w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                !trialEligible || trialActive
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {trialActive
                ? "Trial already running"
                : trialEligible
                ? `Start ${TRIAL_LENGTH_DAYS}-day trial`
                : "Trial already used"}
            </button>

            <div className="mt-6">
              <div
                ref={paypalContainerRef}
                className="flex justify-center"
              ></div>
              {!clientId && (
                <p className="mt-3 text-xs text-rose-500">
                  PayPal client ID missing.
                </p>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Payments handled securely by PayPal. Cancel anytime from this
              dashboard.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
