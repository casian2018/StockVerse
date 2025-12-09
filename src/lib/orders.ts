export type OrderColorMode = "mono" | "color";

export type OrderStatus =
  | "submitted"
  | "proofs_ready"
  | "client_confirmed"
  | "client_rejected"
  | "admin_confirmed"
  | "cancelled"
  | "paid";

export type OrderPaymentStatus = "blocked" | "ready" | "paid";

export type OrderClientDecision = "pending" | "approved" | "rejected";

export interface OrderFilePayload {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

import { ObjectId } from "mongodb";

export interface OrderRecord {
  _id?: string | ObjectId;
  orderNumber: string;
  business: string | null;
  createdBy: string;
  createdByName?: string;
  title: string;
  usage: string;
  description: string;
  colorMode: OrderColorMode;
  colors: string[];
  details: string;
  attachments: OrderFilePayload[];
  proofs: OrderFilePayload[];
  status: OrderStatus;
  clientDecision: OrderClientDecision;
  paymentStatus: OrderPaymentStatus;
  quoteAmount?: number | null;
  paymentLink?: string | null;
  clientNotes?: string | null;
  adminNotes?: string | null;
  clientConfirmedAt?: string | null;
  adminConfirmedAt?: string | null;
  paidAt?: string | null;
  paypalOrderId?: string | null;
  pendingPayPalOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const COLOR_MODE_OPTIONS: Array<{
  value: OrderColorMode;
  label: string;
  helper: string;
}> = [
  {
    value: "mono",
    label: "Mono-colored",
    helper: "One hero tone for engraves, etching, or embossed assets.",
  },
  {
    value: "color",
    label: "Color palette",
    helper: "Full spectrum work such as decals, wraps, and digital assets.",
  },
];

export const ORDER_USAGE_OPTIONS = [
  "Brand kit",
  "Merch / apparel",
  "Packaging",
  "Signage",
  "Digital",
  "Other",
] as const;

export type OrderUsage = (typeof ORDER_USAGE_OPTIONS)[number];

export const ORDER_STATUS_LABELS: Record<
  OrderStatus,
  { label: string; tone: "info" | "success" | "warning" | "danger" }
> = {
  submitted: { label: "Awaiting review", tone: "info" },
  proofs_ready: { label: "Proofs ready", tone: "info" },
  client_confirmed: { label: "Client confirmed", tone: "success" },
  client_rejected: { label: "Client rejected", tone: "danger" },
  admin_confirmed: { label: "Admin confirmed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
};

export const PAYMENT_STATUS_LABELS: Record<
  OrderPaymentStatus,
  { label: string; tone: "info" | "success" | "danger" }
> = {
  blocked: { label: "Waiting", tone: "info" },
  ready: { label: "Ready to pay", tone: "info" },
  paid: { label: "Paid", tone: "success" },
};
