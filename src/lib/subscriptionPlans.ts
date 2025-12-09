export type SubscriptionPlanId = "basic" | "pro" | "enterprise";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  billingPeriod: "/mo";
  features: string[];
  tag?: string;
  description?: string;
}

export const TRIAL_LENGTH_DAYS = 14;

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 4.99,
    billingPeriod: "/mo",
    features: [
      "1 workspace • up to 5 seats",
      "Tasks, inventory, and basic dashboards",
      "Community + email support",
    ],
    tag: "Getting started",
    description: "For solo operators digitizing their workflows.",
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    billingPeriod: "/mo",
    features: [
      "3 workspaces • up to 25 seats",
      "Automations, chat, shared notebook",
      "Role-aware reporting + priority support",
    ],
    tag: "Best value",
    description: "For growing teams that need automation and collaboration.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 49.99,
    billingPeriod: "/mo",
    features: [
      "Unlimited workspaces & seats",
      "AI forecasting, audit logs, custom branding",
      "SSO/SAML, API & webhook access, dedicated CSM",
    ],
    tag: "Scale without limits",
    description: "For multi-site organizations needing security + white-glove onboarding.",
  },
];

export const subscriptionPlanMap: Record<SubscriptionPlanId, SubscriptionPlan> =
  subscriptionPlans.reduce((acc, plan) => {
    acc[plan.id] = plan;
    return acc;
  }, {} as Record<SubscriptionPlanId, SubscriptionPlan>);

export type SubscriptionStatus = "trial" | "active" | "inactive" | "canceled";

export interface SubscriptionRecord {
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialUsed?: boolean;
  lastPaidAt?: string;
  activeSince?: string;
  paypalOrderId?: string;
  updatedAt?: string;
}

export function isSubscriptionActive(
  subscription?: SubscriptionRecord | null
): boolean {
  if (!subscription) return false;
  if (subscription.status === "active") return true;
  if (
    subscription.status === "trial" &&
    subscription.trialEndsAt &&
    new Date(subscription.trialEndsAt) > new Date()
  ) {
    return true;
  }
  return false;
}
