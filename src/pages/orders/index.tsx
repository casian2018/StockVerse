"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuid } from "uuid";
import {
  COLOR_MODE_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_USAGE_OPTIONS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders";
import type {
  OrderColorMode,
  OrderFilePayload,
  OrderRecord,
} from "@/lib/orders";
import { useI18n } from "@/context/I18nContext";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Palette,
  Paperclip,
  Plus,
  Upload,
  XCircle,
} from "lucide-react";

declare global {
  interface Window {
    paypal?: any;
  }
}

const MAX_ATTACHMENTS = 6;
const MAX_FILE_SIZE = 6 * 1024 * 1024;

interface OrderFormState {
  title: string;
  usage: string;
  description: string;
  details: string;
  colorMode: OrderColorMode;
  colors: string[];
  attachments: OrderFilePayload[];
}

const makeInitialForm = (): OrderFormState => ({
  title: "",
  usage: ORDER_USAGE_OPTIONS[0],
  description: "",
  details: "",
  colorMode: "mono",
  colors: ["#111827"],
  attachments: [],
});

export default function OrdersPage() {
  const { user, loading, error } = useAuth({ requireSubscription: true });
  const { formatCurrency, formatDate } = useI18n();
  const [composer, setComposer] = useState<OrderFormState>(() => makeInitialForm());
  const [formBusy, setFormBusy] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [orderBusy, setOrderBusy] = useState<Record<string, string>>({});
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  const isAdmin = user?.role === "Admin";

  const flagOrderBusy = useCallback((id: string, label?: string) => {
    setOrderBusy((prev) => {
      const next = { ...prev };
      if (label) {
        next[id] = label;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to load orders");
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Unable to load orders"
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      loadOrders();
    }
  }, [loading, user, loadOrders]);

  useEffect(() => {
    if (!paypalClientId) {
      setPaypalError(
        "Set NEXT_PUBLIC_PAYPAL_CLIENT_ID to enable in-app payments."
      );
      return;
    }
    if (typeof window === "undefined") return;
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () =>
      setPaypalError("PayPal failed to load. Try refreshing the page.");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [paypalClientId]);

  const handleAttachmentAdd = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const slots = MAX_ATTACHMENTS - composer.attachments.length;
    if (slots <= 0) {
      setStatusMessage("You have reached the upload limit (6 files).");
      return;
    }
    const files = Array.from(fileList).slice(0, slots);
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setStatusMessage("Files must be 6MB or smaller.");
      return;
    }
    try {
      const payloads = await Promise.all(files.map((file) => fileToPayload(file, user?.email)));
      setComposer((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...payloads],
      }));
    } catch {
      setStatusMessage("Unable to read one of the files you selected.");
    }
  };

  const removeAttachment = (id: string) => {
    setComposer((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((file) => file.id !== id),
    }));
  };

  const setColorMode = (mode: OrderColorMode) => {
    setComposer((prev) => ({
      ...prev,
      colorMode: mode,
      colors:
        mode === "mono"
          ? [prev.colors[0] || "#111827"]
          : prev.colors.length > 1
          ? prev.colors
          : [prev.colors[0] || "#111827", "#2563EB"],
    }));
  };

  const updateColor = (index: number, value: string) => {
    setComposer((prev) => {
      const next = [...prev.colors];
      next[index] = value || "#111827";
      return { ...prev, colors: next };
    });
  };

  const addColor = () => {
    setComposer((prev) => {
      if (prev.colors.length >= 6) return prev;
      return { ...prev, colors: [...prev.colors, "#ffffff"] };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formBusy) return;
    if (!composer.title.trim() || !composer.description.trim()) {
      setStatusMessage("Add a title and short description.");
      return;
    }
    if (composer.attachments.length === 0) {
      setStatusMessage("Attach at least one reference file.");
      return;
    }
    setFormBusy(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: composer.title,
          usage: composer.usage,
          description: composer.description,
          details: composer.details,
          colorMode: composer.colorMode,
          colors: composer.colors,
          attachments: composer.attachments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to submit order");
      }
      setOrders((prev) => [data.order, ...prev]);
      setComposer(makeInitialForm());
      setStatusMessage("Order submitted. We’ll let you know when proofs are ready.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Unable to submit order.");
    } finally {
      setFormBusy(false);
    }
  };

  const handleOrderUpdated = useCallback((updated: OrderRecord) => {
    setOrders((prev) => {
      const exists = prev.some((order) => order._id === updated._id);
      if (!exists) return [updated, ...prev];
      return prev.map((order) => (order._id === updated._id ? updated : order));
    });
  }, []);

  const runOrderAction = async (
    orderId: string,
    payload: Record<string, unknown>,
    successMessage?: string
  ) => {
    flagOrderBusy(orderId, "Saving…");
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to update order");
      }
      handleOrderUpdated(data.order);
      if (successMessage) {
        setStatusMessage(successMessage);
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Unable to update order.");
    } finally {
      flagOrderBusy(orderId);
    }
  };

  const handleProofUpload = async (orderId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const uploads = Array.from(files).slice(0, 4);
    if (uploads.some((file) => file.size > MAX_FILE_SIZE)) {
      setStatusMessage("Proof files must be 6MB or smaller.");
      return;
    }
    try {
      const payloads = await Promise.all(
        uploads.map((file) => fileToPayload(file, user?.email))
      );
      await runOrderAction(
        orderId,
        { action: "appendProofs", files: payloads },
        "Proofs uploaded."
      );
    } catch {
      setStatusMessage("Unable to process the proof files.");
    }
  };

  const confirmClientDecision = (orderId: string, decision: "approved" | "rejected") =>
    runOrderAction(
      orderId,
      { action: "clientDecision", decision },
      decision === "approved"
        ? "Thanks! We’ll confirm the order shortly."
        : "We’ll revisit the order with your feedback."
    );

  const cancelOrder = (orderId: string) =>
    runOrderAction(orderId, { action: "cancel" }, "Order cancelled.");

  const adminConfirmOrder = (
    orderId: string,
    quoteAmount: string,
    paymentLink: string | null,
    note: string
  ) =>
    runOrderAction(
      orderId,
      {
        action: "adminConfirm",
        quoteAmount,
        paymentLink,
        note: note || undefined,
      },
      "Order confirmed. Payment can begin."
    );

  const markPaid = (orderId: string) =>
    runOrderAction(orderId, { action: "markPaid" }, "Order marked as paid.");

  const composerReady =
    composer.title.trim().length > 2 &&
    composer.description.trim().length > 5 &&
    composer.attachments.length > 0 &&
    !formBusy;

  if ((loading && !user) || ordersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading workspace…
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

  if (!user) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user.role} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-16 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-16 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 pb-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Custom orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload references, pick a palette, and track proofs, approvals, and payments.
          </p>
        </motion.div>

        {statusMessage && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {statusMessage}
          </div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/80 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs uppercase text-indigo-500 font-semibold tracking-wide">
                Request
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                Start a new order
              </h2>
            </div>
            <CheckCircle2 className="w-8 h-8 text-indigo-500" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  What do you need?
                </label>
                <input
                  type="text"
                  value={composer.title}
                  onChange={(e) =>
                    setComposer((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="e.g., Minimalist mono logo"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Usage
                </label>
                <select
                  value={composer.usage}
                  onChange={(e) =>
                    setComposer((prev) => ({ ...prev, usage: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-300"
                >
                  {ORDER_USAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Short summary
                </label>
                <textarea
                  value={composer.description}
                  onChange={(e) =>
                    setComposer((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="Tell us what this order should include."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Additional context
                </label>
                <textarea
                  value={composer.details}
                  onChange={(e) =>
                    setComposer((prev) => ({ ...prev, details: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="Specs, quantities, or anything else we should know."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Color direction
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COLOR_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColorMode(option.value)}
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      composer.colorMode === option.value
                        ? "border-indigo-400 bg-indigo-50/80 shadow-inner"
                        : "border-gray-200 hover:border-indigo-200"
                    )}
                  >
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-indigo-500" />
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{option.helper}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                {composer.colors.map((color, idx) => (
                  <div
                    key={`${color}-${idx}`}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(idx, e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-gray-200 bg-white"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => updateColor(idx, e.target.value)}
                      className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm"
                    />
                    {composer.colorMode === "color" && composer.colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setComposer((prev) => ({
                            ...prev,
                            colors: prev.colors.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-xs text-gray-400 hover:text-rose-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {composer.colorMode === "color" && composer.colors.length < 6 && (
                  <button
                    type="button"
                    onClick={addColor}
                    className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-indigo-200 hover:text-indigo-500"
                  >
                    <Plus className="w-4 h-4" />
                    Add color
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Reference files
              </label>
              <p className="text-xs text-gray-500">
                Upload up to {MAX_ATTACHMENTS} files (PNG, JPG, SVG, or PDF, max 6MB each).
              </p>
              <div className="mt-3 flex flex-wrap gap-3 items-center">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/60 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100">
                  <Upload className="w-4 h-4" />
                  Add files
                  <input
                    type="file"
                    accept="image/*,.pdf,.svg"
                    multiple
                    onChange={(e) => handleAttachmentAdd(e.target.files)}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-400">
                  {composer.attachments.length}/{MAX_ATTACHMENTS} attached
                </span>
              </div>
              {composer.attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {composer.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-2 text-sm text-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span>{file.name}</span>
                        <span className="text-xs text-gray-400">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-xs text-gray-400 hover:text-rose-500"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!composerReady}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 font-semibold text-white shadow transition",
                  composerReady
                    ? "bg-gradient-to-r from-indigo-600 to-blue-500 hover:scale-[1.01]"
                    : "bg-gray-300 cursor-not-allowed"
                )}
              >
                {formBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                Place order
              </button>
            </div>
          </form>
        </motion.section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Order queue
            </h2>
            <button
              onClick={loadOrders}
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-gray-200 bg-white/70 px-6 py-8 text-center text-gray-500">
              No orders yet. Use the form above to kick off your first request.
            </p>
          ) : (
            orders.map((order) => {
              const statusMeta = ORDER_STATUS_LABELS[order.status];
              const paymentMeta = PAYMENT_STATUS_LABELS[order.paymentStatus];
              const busyLabel = orderBusy[order._id ? order._id.toString() : ""];
              const isOwner = order.createdBy === user.email;
              const needsPayment =
                order.status === "admin_confirmed" && order.paymentStatus === "ready";
              return (
                <motion.article
                  key={order._id?.toString()}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {order.orderNumber}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {order.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Requested by {order.createdByName || order.createdBy}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge meta={statusMeta} />
                      <StatusBadge meta={paymentMeta} icon={<CreditCard className="w-3.5 h-3.5" />} />
                      {busyLabel && (
                        <span className="text-xs text-gray-400">{busyLabel}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-dashed border-gray-100">
                    <InfoBlock
                      icon={<Palette className="w-4 h-4 text-indigo-500" />}
                      title="Palette"
                    >
                      <div className="flex flex-wrap gap-2">
                        {order.colors.map((color) => (
                          <span
                            key={`${order._id?.toString()}-${color}`}
                            className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600"
                          >
                            <span
                              className="h-4 w-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                            {color}
                          </span>
                        ))}
                      </div>
                    </InfoBlock>
                    <InfoBlock
                      icon={<Paperclip className="w-4 h-4 text-indigo-500" />}
                      title={`Uploads (${order.attachments.length})`}
                    >
                      {order.attachments.length === 0 ? (
                        <p className="text-xs text-gray-400">No files.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {order.attachments.map((file) => (
                            <FileChip key={file.id} file={file} />
                          ))}
                        </div>
                      )}
                    </InfoBlock>
                    <InfoBlock
                      icon={<FileText className="w-4 h-4 text-indigo-500" />}
                      title={`Proofs (${order.proofs.length})`}
                    >
                      {order.proofs.length === 0 ? (
                        <p className="text-xs text-gray-400">Pending upload.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {order.proofs.map((file) => (
                            <FileChip key={file.id} file={file} />
                          ))}
                        </div>
                      )}
                    </InfoBlock>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TimelineBlock
                      label="Created"
                      value={order.createdAt}
                      formatDate={formatDate}
                      icon={<Clock className="w-4 h-4 text-gray-400" />}
                    />
                    <TimelineBlock
                      label="Updated"
                      value={order.updatedAt}
                      formatDate={formatDate}
                      icon={<Clock className="w-4 h-4 text-gray-400" />}
                    />
                    {order.clientConfirmedAt && (
                      <TimelineBlock
                        label="Client confirmed"
                        value={order.clientConfirmedAt}
                        formatDate={formatDate}
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      />
                    )}
                    {order.adminConfirmedAt && (
                      <TimelineBlock
                        label="Admin confirmed"
                        value={order.adminConfirmedAt}
                        formatDate={formatDate}
                        icon={<CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                      />
                    )}
                  </div>

                  {order.adminNotes && (
                    <NoteBlock label="Admin notes" value={order.adminNotes} />
                  )}
                  {order.clientNotes && (
                    <NoteBlock label="Client notes" value={order.clientNotes} />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {isOwner && (
                      <ClientActions
                        order={order}
                        busy={Boolean(busyLabel)}
                        needsPayment={needsPayment}
                        paypalReady={paypalReady && Boolean(paypalClientId)}
                        paypalError={paypalError}
                        onDecision={confirmClientDecision}
                        onCancel={cancelOrder}
                        formatCurrency={formatCurrency}
                        onPaymentComplete={handleOrderUpdated}
                        setStatus={setStatusMessage}
                      />
                    )}
                    {isAdmin && (
                      <AdminActions
                        order={order}
                        busy={Boolean(busyLabel)}
                        onProofUpload={handleProofUpload}
                        onConfirm={adminConfirmOrder}
                        onCancel={cancelOrder}
                        onMarkPaid={markPaid}
                        formatCurrency={formatCurrency}
                      />
                    )}
                  </div>
                </motion.article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500 flex items-center gap-2 uppercase tracking-wide">
        {icon}
        {title}
      </p>
      <div className="mt-2 text-sm text-gray-700">{children}</div>
    </div>
  );
}

function FileChip({ file }: { file: OrderFilePayload }) {
  return (
    <button
      type="button"
      onClick={() => openDataUrl(file)}
      className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
    >
      <Download className="w-3.5 h-3.5" />
      {file.name}
    </button>
  );
}

function TimelineBlock({
  label,
  value,
  formatDate,
  icon,
}: {
  label: string;
  value?: string | null;
  formatDate: (date: Date | number) => string;
  icon: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p>{formatDate(new Date(value))}</p>
      </div>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-800">
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 whitespace-pre-line">{value}</p>
    </div>
  );
}

function StatusBadge({
  meta,
  icon,
}: {
  meta: { label: string; tone: "info" | "success" | "warning" | "danger" };
  icon?: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    info: "bg-indigo-50 text-indigo-600 border-indigo-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    danger: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[meta.tone]
      )}
    >
      {icon}
      {meta.label}
    </span>
  );
}

function ClientActions({
  order,
  busy,
  needsPayment,
  paypalReady,
  paypalError,
  onDecision,
  onCancel,
  formatCurrency,
  onPaymentComplete,
  setStatus,
}: {
  order: OrderRecord;
  busy: boolean;
  needsPayment: boolean;
  paypalReady: boolean;
  paypalError: string | null;
  onDecision: (orderId: string, decision: "approved" | "rejected") => void;
  onCancel: (orderId: string) => void;
  formatCurrency: (value: number, opts?: Intl.NumberFormatOptions) => string;
  onPaymentComplete: (order: OrderRecord) => void;
  setStatus: (message: string | null) => void;
}) {
  const amountLabel =
    order.quoteAmount && order.quoteAmount > 0
      ? formatCurrency(order.quoteAmount, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;
  const status = order.status;
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">Client actions</p>
      {status === "proofs_ready" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onDecision(order._id ? order._id.toString() : "", "approved")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow hover:scale-[1.01]"
          >
            Approve proof
          </button>
          <button
            type="button"
              onClick={() => onDecision(order._id ? order._id.toString() : "", "rejected")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-rose-200 hover:text-rose-500"
          >
            Request changes
          </button>
        </div>
      )}

      {needsPayment && (
        <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            Payment due {amountLabel ? `(${amountLabel})` : ""}
          </p>
          {paypalReady ? (
              <PayPalButton
                orderId={order._id ? order._id.toString() : ""}
              onSuccess={onPaymentComplete}
              setStatus={setStatus}
              successMessage="Payment complete. Thank you!"
            />
          ) : (
            <p className="text-xs text-amber-600">
              {paypalError || "Loading PayPal…"}
            </p>
          )}
        </div>
      )}

      {status !== "cancelled" && status !== "paid" && (
        <button
          type="button"
          onClick={() => onCancel(order._id ? order._id.toString() : "")}
          disabled={busy || String(status) === "paid"}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          <XCircle className="w-4 h-4" />
          Cancel order
        </button>
      )}
    </div>
  );
}

function AdminActions({
  order,
  busy,
  onProofUpload,
  onConfirm,
  onCancel,
  onMarkPaid,
  formatCurrency,
}: {
  order: OrderRecord;
  busy: boolean;
  onProofUpload: (orderId: string, files: FileList | null) => void;
  onConfirm: (orderId: string, quote: string, link: string | null, note: string) => void;
  onCancel: (orderId: string) => void;
  onMarkPaid: (orderId: string) => void;
  formatCurrency: (value: number, opts?: Intl.NumberFormatOptions) => string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [quote, setQuote] = useState(order.quoteAmount ? String(order.quoteAmount) : "");
  const [paymentLink, setPaymentLink] = useState(order.paymentLink || "");
  const [note, setNote] = useState("");

  useEffect(() => {
    setQuote(order.quoteAmount ? String(order.quoteAmount) : "");
    setPaymentLink(order.paymentLink || "");
  }, [order.quoteAmount, order.paymentLink]);

  const showConfirm = order.clientDecision === "approved" && order.status !== "admin_confirmed";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">Admin controls</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-indigo-200 hover:text-indigo-500"
        >
          <Upload className="w-4 h-4" />
          Upload proofs
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.svg"
          multiple
          className="hidden"
          onChange={(e) => {
            onProofUpload(order._id ? order._id.toString() : "", e.target.files);
            e.target.value = "";
          }}
        />
        {order.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onCancel(order._id ? order._id.toString() : "")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Cancel
          </button>
        )}
        {order.paymentStatus === "ready" && order.status === "admin_confirmed" && (
            <button
            type="button"
            onClick={() => onMarkPaid(order._id ? order._id.toString() : "")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
          >
            Mark paid
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-gray-800">
            Confirm order & release payment
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Quote amount (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm"
                placeholder="e.g., 149.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Payment link (optional)
              </label>
              <input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm"
                placeholder="e.g., https://pay.example.com/invoice"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">
              Notes for client (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm"
              placeholder="Extra guidance or delivery notes."
            />
          </div>
          <button
            type="button"
            onClick={() => onConfirm(order._id ? order._id.toString() : "", quote, paymentLink || null, note)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:scale-[1.01]"
          >
            Confirm order
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Latest quote:{" "}
        {order.quoteAmount
          ? formatCurrency(order.quoteAmount, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "Not set"}
      </p>
    </div>
  );
}

function PayPalButton({
  orderId,
  onSuccess,
  setStatus,
  successMessage,
}: {
  orderId: string;
  onSuccess: (order: OrderRecord) => void;
  setStatus: (message: string | null) => void;
  successMessage?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.paypal || !ref.current) {
      return;
    }

    buttonsRef.current?.close?.();

    buttonsRef.current = window.paypal.Buttons({
      style: { shape: "pill", color: "gold" },
      createOrder: async () => {
        const response = await fetch("/api/orders/pay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to start payment");
        }
        return data.orderId;
      },
      onApprove: async (data: any) => {
        const response = await fetch("/api/orders/pay/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to confirm payment");
        }
        onSuccess(payload.order);
        setStatus(successMessage ?? "Payment complete.");
      },
      onError: () => {
        setStatus("PayPal encountered an error. Please try again.");
      },
    });

    buttonsRef.current.render(ref.current);

    return () => {
      buttonsRef.current?.close?.();
    };
  }, [orderId, onSuccess, setStatus, successMessage]);

  return <div ref={ref} className="mt-1" />;
}

function openDataUrl(file: OrderFilePayload) {
  const link = document.createElement("a");
  link.href = file.dataUrl;
  link.download = file.name || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function fileToPayload(file: File, uploadedBy?: string | null) {
  return new Promise<OrderFilePayload>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: uuid(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy || "client",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function clsx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
