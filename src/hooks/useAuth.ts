"use client";

import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  SubscriptionRecord,
  isSubscriptionActive,
} from "@/lib/subscriptionPlans";

interface PersonalRecord {
  legalname?: string;
  email?: string;
  role?: string;
  phone?: string;
  salary?: number;
  startDate?: string;
  birthDate?: string;
  department?: string;
}

export interface AuthUser {
  _id?: string;
  email: string;
  profilename?: string;
  business?: string;
  role?: string;
  phone?: string;
  country?: string | null;
  currency?: string | null;
  locale?: string | null;
  personal?: PersonalRecord[];
  stocks?: any[];
  businessSubscriptionActive?: boolean;
  businessSubscriptionOwner?: string | null;
  businessSubscriptionPlanId?: string | null;
  [key: string]: unknown;
  subscription?: SubscriptionRecord;
}

interface UseAuthOptions {
  redirectToLogin?: boolean;
  requireSubscription?: boolean;
  subscriptionRedirectPath?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const {
    redirectToLogin = true,
    requireSubscription = false,
    subscriptionRedirectPath = "/subscription",
  } = options;
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/getUserInfo", {
          credentials: "include",
          signal,
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const data: AuthUser = await response.json();
        const hasAccess =
          isSubscriptionActive(data.subscription) ||
          Boolean(data.businessSubscriptionActive);

        if (requireSubscription && !hasAccess) {
          setUser(data);
          const message =
            "A subscription is required to access this page. Choose a plan to continue.";
          setError(message);
          if (
            subscriptionRedirectPath &&
            router.pathname !== subscriptionRedirectPath
          ) {
            router.replace(
              subscriptionRedirectPath +
                (data.subscription?.planId
                  ? `?plan=${data.subscription.planId}`
                  : "")
            );
          }
          return null;
        }

        setUser(data);
        return data;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return null;
        }

        setUser(null);
        const message =
          err instanceof Error ? err.message : "Unable to authenticate";
        setError(message);

        if (redirectToLogin) {
          router.replace("/login");
        }

        return null;
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [redirectToLogin, router]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchUser(controller.signal);

    return () => controller.abort();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refresh: () => fetchUser(),
  };
}
