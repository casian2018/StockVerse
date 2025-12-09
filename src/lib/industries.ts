export type IndustryId =
  | "general"
  | "retail"
  | "ecommerce"
  | "it"
  | "finance"
  | "manufacturing"
  | "healthcare";

export interface IndustryProfile {
  id: IndustryId;
  name: string;
  tagline: string;
  recommendedModules: string[];
  description: string;
}

export const industries: IndustryProfile[] = [
  {
    id: "retail",
    name: "Retail / Storefront",
    tagline: "Track inventory turns, staff tasks, and recurring vendors.",
    recommendedModules: ["stocks", "tasks", "automations"],
    description:
      "Focus on restock alerts, vendor scorecards, and daily task boards to keep stores on track.",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    tagline: "Stay on top of fulfillment, automation, and customer follow-ups.",
    recommendedModules: ["automations", "tasks", "chat"],
    description:
      "Lean on automations for alerts, cross-team chat for escalations, and shared tasks for launch calendars.",
  },
  {
    id: "it",
    name: "IT / Software",
    tagline: "Coordinate sprints, incidents, and proactive ops.",
    recommendedModules: ["tasks", "notes", "chat"],
    description:
      "Use the tasks board for sprint planning, the shared notebook for runbooks, and chat for quick escalations.",
  },
  {
    id: "finance",
    name: "Finance / Professional Services",
    tagline: "Standardize client workflows and automate reminders.",
    recommendedModules: ["automations", "notes", "tasks"],
    description:
      "Document client playbooks, automate renewal nudges, and track workload with interactive tasks.",
  },
  {
    id: "manufacturing",
    name: "Manufacturing / Ops",
    tagline: "Digitize floor checks, asset tracking, and alerts.",
    recommendedModules: ["stocks", "tasks", "automations"],
    description:
      "Blend barcoded asset tracking with compliance tasks and alerting for safety or maintenance.",
  },
  {
    id: "healthcare",
    name: "Healthcare / Wellness",
    tagline: "Centralize procedures, assignments, and compliance deadlines.",
    recommendedModules: ["notes", "tasks", "chat"],
    description:
      "Keep teams aligned with SOP libraries, shared calendars, and fast chat escalations.",
  },
  {
    id: "general",
    name: "General business",
    tagline: "A flexible hub for automations, tasks, and BI.",
    recommendedModules: ["tasks", "automations", "notes"],
    description:
      "Mix and match modules to fit HR, ops, or leadership workflows without extra setup.",
  },
];

export const industriesMap = industries.reduce<Record<IndustryId, IndustryProfile>>(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<IndustryId, IndustryProfile>
);

export const focusAreas = [
  { id: "ops", label: "Operations excellence" },
  { id: "sales", label: "Sales & customer success" },
  { id: "product", label: "Product & engineering" },
  { id: "finance", label: "Finance & compliance" },
  { id: "people", label: "People & culture" },
];

export const countries = [
  { code: "US", label: "United States", currency: "USD", locale: "en-US" },
  { code: "GB", label: "United Kingdom", currency: "GBP", locale: "en-GB" },
  { code: "CA", label: "Canada", currency: "CAD", locale: "en-CA" },
  { code: "DE", label: "Germany", currency: "EUR", locale: "de-DE" },
  { code: "FR", label: "France", currency: "EUR", locale: "fr-FR" },
  { code: "IN", label: "India", currency: "INR", locale: "en-IN" },
  { code: "BR", label: "Brazil", currency: "BRL", locale: "pt-BR" },
  { code: "AU", label: "Australia", currency: "AUD", locale: "en-AU" },
  { code: "JP", label: "Japan", currency: "JPY", locale: "ja-JP" },
  { code: "ZA", label: "South Africa", currency: "ZAR", locale: "en-ZA" },
];
