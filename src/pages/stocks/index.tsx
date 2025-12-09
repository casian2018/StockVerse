"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Boxes, Star, TrendingDown } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface VendorInfo {
  name: string;
  contact?: string;
  score?: number;
}

export interface Stock {
  productName: string;
  price: number;
  location: string;
  dateOfPurchase: string;
  quantity: number;
  barcode?: string;
  reorderPoint?: number;
  assetLifeYears?: number;
  residualValue?: number;
  vendor?: VendorInfo;
  lastAuditDate?: string;
  notes?: string;
}

type StockSetter = React.Dispatch<React.SetStateAction<Stock>>;

const emptyVendor: VendorInfo = {
  name: "",
  contact: "",
  score: 80,
};

const createEmptyStock = (): Stock => ({
  productName: "",
  price: 0,
  location: "",
  dateOfPurchase: "",
  quantity: 0,
  barcode: "",
  reorderPoint: 10,
  assetLifeYears: 5,
  residualValue: 0,
  vendor: { ...emptyVendor },
  lastAuditDate: "",
  notes: "",
});

const normalizeStockRecord = (raw: Partial<Stock>): Stock => ({
  productName: raw.productName || "",
  price: Number(raw.price) || 0,
  location: raw.location || "",
  dateOfPurchase: raw.dateOfPurchase || "",
  quantity: Number(raw.quantity) || 0,
  barcode: raw.barcode || "",
  reorderPoint:
    raw.reorderPoint !== undefined ? Number(raw.reorderPoint) : undefined,
  assetLifeYears:
    raw.assetLifeYears !== undefined ? Number(raw.assetLifeYears) : undefined,
  residualValue:
    raw.residualValue !== undefined ? Number(raw.residualValue) : undefined,
  vendor: {
    ...emptyVendor,
    ...(raw.vendor || {}),
    score:
      raw.vendor?.score !== undefined
        ? Math.min(100, Math.max(0, Number(raw.vendor.score)))
        : emptyVendor.score,
  },
  lastAuditDate: raw.lastAuditDate || "",
  notes: raw.notes || "",
});

const sanitizeStockForRequest = (stock: Stock) => ({
  ...stock,
  price: Number(stock.price) || 0,
  quantity: Number(stock.quantity) || 0,
  reorderPoint:
    stock.reorderPoint !== undefined ? Number(stock.reorderPoint) : undefined,
  assetLifeYears:
    stock.assetLifeYears !== undefined ? Number(stock.assetLifeYears) : undefined,
  residualValue:
    stock.residualValue !== undefined ? Number(stock.residualValue) : undefined,
  vendor: stock.vendor
    ? {
        name: stock.vendor.name,
        contact: stock.vendor.contact,
        score:
          stock.vendor.score !== undefined
            ? Math.min(100, Math.max(0, Number(stock.vendor.score)))
            : undefined,
      }
    : undefined,
});

const formatCurrency = (
  value: number,
  currency: string,
  locale: string,
  maximumFractionDigits = 0
) =>
  new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits,
  }).format(value || 0);

const calculateBookValue = (stock: Stock) => {
  if (!stock.assetLifeYears || stock.assetLifeYears <= 0) {
    return { bookValue: stock.price, percentRemaining: 100, yearsRemaining: 0 };
  }

  const purchaseDate = stock.dateOfPurchase
    ? new Date(stock.dateOfPurchase)
    : new Date();
  const now = new Date();
  const yearsElapsed =
    (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const residual = Number(stock.residualValue) || 0;
  const depreciable = Math.max(0, stock.price - residual);
  const annualDepreciation = depreciable / stock.assetLifeYears;
  const depreciationTaken = Math.min(
    depreciable,
    annualDepreciation * Math.max(0, yearsElapsed)
  );
  const bookValue = Math.max(residual, stock.price - depreciationTaken);
  const percentRemaining = stock.price
    ? Math.round((bookValue / stock.price) * 100)
    : 100;
  const yearsRemaining = Math.max(
    0,
    stock.assetLifeYears - Math.floor(yearsElapsed)
  );

  return { bookValue, percentRemaining, yearsRemaining };
};

const buildDepreciationSchedule = (stock: Stock) => {
  if (!stock.assetLifeYears || stock.assetLifeYears <= 0) return [];
  const residual = Number(stock.residualValue) || 0;
  const depreciable = Math.max(0, stock.price - residual);
  const perYear = depreciable / stock.assetLifeYears;
  const baseYear = stock.dateOfPurchase
    ? new Date(stock.dateOfPurchase).getFullYear()
    : new Date().getFullYear();

  const schedule = [];
  for (let year = 0; year <= stock.assetLifeYears; year += 1) {
    const depreciation = Math.min(depreciable, perYear * year);
    const bookValue = Math.max(residual, stock.price - depreciation);
    schedule.push({
      label: year === 0 ? "Purchase" : `Year ${year} (${baseYear + year})`,
      bookValue,
    });
  }
  return schedule;
};

const deriveVendorScorecards = (stocks: Stock[]) => {
  const map = new Map<
    string,
    { totalItems: number; avgScore: number; locations: Set<string>; spend: number }
  >();

  stocks.forEach((stock) => {
    if (!stock.vendor?.name) return;
    const key = stock.vendor.name;
    const entry =
      map.get(key) ||
      {
        totalItems: 0,
        avgScore: 0,
        locations: new Set<string>(),
        spend: 0,
      };

    entry.totalItems += 1;
    entry.avgScore += stock.vendor?.score || 0;
    if (stock.location) entry.locations.add(stock.location);
    entry.spend += stock.price * stock.quantity;
    map.set(key, entry);
  });

  return Array.from(map.entries()).map(([vendor, data]) => ({
    vendor,
    totalItems: data.totalItems,
    avgScore: Math.round(data.avgScore / data.totalItems),
    locations: Array.from(data.locations),
    spend: data.spend,
  }));
};

function StockPage() {
  const { user, loading: authLoading, error: authError } = useAuth({
    requireSubscription: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newStock, setNewStock] = useState<Stock>(createEmptyStock());
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [scheduleStock, setScheduleStock] = useState<Stock | null>(null);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"new" | "edit" | null>(
    null
  );
  const [showNewBarcodeField, setShowNewBarcodeField] = useState(false);
  const [showEditBarcodeField, setShowEditBarcodeField] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const normalized =
      (user?.stocks || []).map((record: any) => normalizeStockRecord(record)) ||
      [];
    setStocks(normalized);
    setStocksLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    setShowEditBarcodeField(Boolean(editingStock?.barcode));
  }, [editingStock]);

  const handleStockFieldChange = (
    setter: StockSetter,
    field: keyof Stock,
    value: string,
    asNumber = false
  ) => {
    setter((prev) => ({
      ...prev,
      [field]: asNumber ? Number(value) : value,
    }));
  };

  const handleEditingFieldChange = (
    field: keyof Stock,
    value: string,
    asNumber = false
  ) => {
    setEditingStock((prev) =>
      prev
        ? {
            ...prev,
            [field]: asNumber ? Number(value) : value,
          }
        : prev
    );
  };

  const handleNewVendorField = (
    field: keyof VendorInfo,
    value: string,
    asNumber = false
  ) => {
    setNewStock((prev) => ({
      ...prev,
      vendor: {
        ...(prev.vendor || { ...emptyVendor }),
        [field]: asNumber ? Number(value) : value,
      },
    }));
  };

  const handleEditVendorField = (
    field: keyof VendorInfo,
    value: string,
    asNumber = false
  ) => {
    setEditingStock((prev) =>
      prev
        ? {
            ...prev,
            vendor: {
              ...(prev.vendor || { ...emptyVendor }),
              [field]: asNumber ? Number(value) : value,
            },
          }
        : prev
    );
  };

  const addStock = async () => {
    try {
      setError(null);
      const payload = sanitizeStockForRequest(newStock);
      const res = await fetch("/api/addStockInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStocks((prev) => [...prev, normalizeStockRecord(data.stock)]);
      setNewStock(createEmptyStock());
      setShowNewBarcodeField(false);
    } catch {
      setError("Failed to add stock");
    }
  };

  const deleteStock = async (productName: string) => {
    try {
      setError(null);
      const res = await fetch("/api/deleteStockInfo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      if (!res.ok) throw new Error();
      setStocks((prev) => prev.filter((s) => s.productName !== productName));
    } catch {
      setError("Failed to delete stock");
    }
  };

  const editStock = async () => {
    if (!editingStock) return;
    try {
      setError(null);
      const payload = sanitizeStockForRequest(editingStock);
      const res = await fetch("/api/editStockInfo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStocks((prev) =>
        prev.map((s) =>
          s.productName === editingStock.productName
            ? normalizeStockRecord(editingStock)
            : s
        )
      );
      setEditingStock(null);
    } catch {
      setError("Failed to edit stock");
    }
  };

  const currency = (user as any)?.currency || "USD";
  const locale = (user as any)?.locale || "en-US";

  const stats = useMemo(() => {
    const totalValue = stocks.reduce(
      (sum, stock) => sum + stock.price * stock.quantity,
      0
    );
    const reorderCount = stocks.filter(
      (stock) =>
        stock.reorderPoint !== undefined &&
        stock.quantity <= (stock.reorderPoint ?? 0)
    ).length;
    const avgVendorScore =
      stocks.length > 0
        ? Math.round(
            stocks.reduce((sum, stock) => {
              const score = stock.vendor && typeof stock.vendor.score === "number" ? stock.vendor.score : (emptyVendor.score ?? 0);
              return sum + score;
            }, 0) / stocks.length
          )
        : 0;
    const depreciated = stocks.filter(
      (stock) => calculateBookValue(stock).percentRemaining <= 50
    ).length;
    return { totalValue, reorderCount, avgVendorScore, depreciated };
  }, [stocks]);

  const vendorCards = useMemo(
    () => deriveVendorScorecards(stocks),
    [stocks]
  );

  const lowInventory = stocks.filter(
    (stock) =>
      stock.reorderPoint !== undefined &&
      stock.quantity <= (stock.reorderPoint ?? 0)
  );

  const openScanner = (target: "new" | "edit") => {
    if (target === "new") {
      setShowNewBarcodeField(true);
    } else {
      setShowEditBarcodeField(true);
    }
    setScannerTarget(target);
    setScannerOpen(true);
  };

  const handleScanDetected = useCallback(
    (code: string) => {
      if (!code) return;
      if (scannerTarget === "new") {
        setNewStock((prev) => ({ ...prev, barcode: code }));
      } else if (scannerTarget === "edit") {
        setEditingStock((prev) => (prev ? { ...prev, barcode: code } : prev));
      }
    },
    [scannerTarget]
  );

  if ((authLoading && !user) || stocksLoading)
    return <p className="text-center text-gray-600 mt-10">Loading...</p>;
  if (authError)
    return (
      <p className="text-center text-red-500 font-semibold mt-10">
        {authError}
      </p>
    );

  return (
    <div className="relative flex min-h-screen font-inter bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar role={user?.role} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-16 w-72 h-72 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-20 right-16 w-96 h-96 bg-blue-200 rounded-full blur-3xl"
      />

      <main className="relative z-10 flex-1 md:ml-64 w-full px-4 sm:px-8 md:px-10 pt-24 md:pt-10 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6"
        >
          Inventory & Asset Tracking
        </motion.h1>
        {error && (
          <p className="mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          <StatCard
            title="Total asset value"
            value={formatCurrency(stats.totalValue, currency, locale)}
            icon={<Boxes className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Needs reorder"
            value={`${stats.reorderCount} items`}
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            title="Avg vendor score"
            value={`${stats.avgVendorScore}/100`}
            icon={<Star className="w-5 h-5 text-emerald-500" />}
          />
          <StatCard
            title="Half-life assets"
            value={`${stats.depreciated} items`}
            icon={<TrendingDown className="w-5 h-5 text-slate-500" />}
          />
        </div>

        {/* Add Stock Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl p-8 mb-12"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              Add inventory item
            </h2>
            <p className="text-sm text-gray-500">
              Capture barcodes, depreciation, and vendor health in one step.
            </p>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            Only the product name, price, and quantity are required. The rest is
            optional context that powers reports and alerts.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addStock();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Product name"
                required
                helper="Shown everywhere your teammates search."
                value={newStock.productName}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "productName", v)
                }
              />
              <FormField
                label="Purchase price"
                type="number"
                step="0.01"
                required
                helper="Used for depreciation + total asset value."
                value={String(newStock.price)}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "price", v, true)
                }
              />
              <FormField
                label="Location / warehouse"
                helper="Optional storage info like HQ • Row 3."
                value={newStock.location}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "location", v)
                }
              />
              <FormField
                label="Date of purchase"
                type="date"
                helper="Powers depreciation schedules."
                value={newStock.dateOfPurchase}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "dateOfPurchase", v)
                }
              />
              <FormField
                label="Quantity on hand"
                type="number"
                required
                helper="How many units you have right now."
                value={String(newStock.quantity)}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "quantity", v, true)
                }
              />
              {showNewBarcodeField ? (
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Barcode / SKU
                  </label>
                  <p className="text-xs text-gray-400 mb-1">
                    Scan or paste any code you want to track.
                  </p>
                  <div className="flex gap-3">
                    <input
                      value={newStock.barcode || ""}
                      onChange={(e) =>
                        handleStockFieldChange(
                          setNewStock,
                          "barcode",
                          e.target.value
                        )
                      }
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => openScanner("new")}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 transition"
                    >
                      Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewBarcodeField(false);
                        setNewStock((prev) => ({ ...prev, barcode: "" }));
                      }}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-rose-200 hover:text-rose-500 transition"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewBarcodeField(true)}
                  className="mt-6 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  + Track barcode / SKU
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Reorder point"
                type="number"
                helper="Trigger alerts when stock dips to this number."
                value={String(newStock.reorderPoint ?? "")}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "reorderPoint", v, true)
                }
              />
              <FormField
                label="Asset life (years)"
                type="number"
                helper="Straight-line depreciation period."
                value={String(newStock.assetLifeYears ?? "")}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "assetLifeYears", v, true)
                }
              />
              <FormField
                label="Residual value"
                type="number"
                step="0.01"
                helper="Expected value at end of life."
                value={String(newStock.residualValue ?? "")}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "residualValue", v, true)
                }
              />
              <FormField
                label="Last audit date"
                type="date"
                helper="Latest walkthrough or compliance check."
                value={newStock.lastAuditDate || ""}
                onChange={(v) =>
                  handleStockFieldChange(setNewStock, "lastAuditDate", v)
                }
              />
              <FormField
                label="Vendor name"
                helper="Who supplied this item."
                value={newStock.vendor?.name || ""}
                onChange={(v) => handleNewVendorField("name", v)}
              />
              <FormField
                label="Vendor score"
                type="number"
                helper="0–100 quality indicator."
                value={String(newStock.vendor?.score ?? "")}
                onChange={(v) => handleNewVendorField("score", v, true)}
              />
              <FormField
                label="Vendor contact"
                className="md:col-span-2"
                helper="Optional email, Slack, or phone."
                value={newStock.vendor?.contact || ""}
                onChange={(v) => handleNewVendorField("contact", v)}
              />
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-600">
                  Notes
                </label>
                <p className="text-xs text-gray-400 mb-1">
                  Capture inspection reminders, storage instructions, or audit notes.
                </p>
                <textarea
                  value={newStock.notes || ""}
                  onChange={(e) =>
                    handleStockFieldChange(setNewStock, "notes", e.target.value)
                  }
                  rows={3}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-xl shadow hover:scale-[1.02] transition-all"
              >
                + Add asset
              </button>
            </div>
          </form>
        </motion.div>

        {/* Stock Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-3xl shadow-xl overflow-hidden"
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
              <tr>
                {[
                  "Product",
                  "Barcode",
                  "Inventory",
                  "Book value",
                  "Vendor",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-sm font-semibold uppercase tracking-wide"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {stocks.map((s, i) => {
                  const { bookValue, percentRemaining, yearsRemaining } =
                    calculateBookValue(s);
                  const needsReorder =
                    s.reorderPoint !== undefined &&
                    s.quantity <= (s.reorderPoint ?? 0);
                  return (
                    <motion.tr
                      key={s.productName}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-t border-gray-100 hover:bg-indigo-50/30 transition-all"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {s.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.location} • Purchased {s.dateOfPurchase || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {s.barcode ? (
                          <span className="font-mono">{s.barcode}</span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <p
                            className={`font-semibold ${
                              needsReorder
                                ? "text-rose-500"
                                : s.quantity < 50
                                ? "text-amber-500"
                                : "text-emerald-600"
                            }`}
                          >
                            {s.quantity} units
                          </p>
                          {s.reorderPoint !== undefined && (
                            <span className="text-xs text-gray-500">
                              Reorder @ {s.reorderPoint}
                            </span>
                          )}
                        </div>
                        {needsReorder && (
                          <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            Below safety stock
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-indigo-600">
                          {formatCurrency(bookValue, currency, locale)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {percentRemaining}% value • {yearsRemaining}y left
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {s.vendor?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Score {s.vendor?.score ?? "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditingStock(normalizeStockRecord(s));
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm rounded-lg shadow hover:scale-[1.05] transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStock(s.productName)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm rounded-lg shadow hover:scale-[1.05] transition-all"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setScheduleStock(s)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-indigo-300 transition"
                        >
                          View schedule
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>

        {/* Reorder alerts */}
        {lowInventory.length > 0 && (
          <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Items approaching reorder
            </h3>
            <div className="flex flex-wrap gap-4">
              {lowInventory.map((item) => (
                <span
                  key={item.productName}
                  className="text-xs font-semibold text-amber-600 bg-white rounded-full px-3 py-1 shadow-sm"
                >
                  {item.productName} ({item.quantity} / {item.reorderPoint})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vendor scorecards */}
        {vendorCards.length > 0 && (
          <section className="mt-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Vendor scorecards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vendorCards.map((card) => (
                <div
                  key={card.vendor}
                  className="bg-white/80 border border-gray-100 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-lg font-semibold text-gray-900">
                      {card.vendor}
                    </p>
                    <span className="text-sm font-semibold text-indigo-600">
                      {card.avgScore}/100
                    </span>
                  </div>
                  <p className="text-xs uppercase text-gray-400 tracking-wide mb-3">
                    {card.totalItems} assets •{" "}
                    {formatCurrency(card.spend, currency, locale)} value
                  </p>
                  <div className="text-xs text-gray-500">
                    Locations: {card.locations.join(", ") || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(value) => {
          handleScanDetected(value);
          setScannerOpen(false);
        }}
      />

      <AnimatePresence>
        {editingStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Edit asset
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openScanner("edit")}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 transition"
                  >
                    Scan barcode
                  </button>
                  <button
                    onClick={() => {
                      setShowEditBarcodeField((prev) => !prev);
                      if (showEditBarcodeField) {
                        setEditingStock((prev) =>
                          prev ? { ...prev, barcode: "" } : prev
                        );
                      }
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 transition"
                  >
                    {showEditBarcodeField || editingStock?.barcode
                      ? "Hide barcode"
                      : "Add barcode"}
                  </button>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editStock();
                }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Product name"
                    required
                    helper="Visible to everyone searching assets."
                    value={editingStock.productName}
                    onChange={(v) =>
                      handleEditingFieldChange("productName", v)
                    }
                  />
                  <FormField
                    label="Purchase price"
                    type="number"
                    required
                    helper="Drives depreciation math."
                    value={String(editingStock.price)}
                    onChange={(v) => handleEditingFieldChange("price", v, true)}
                  />
                  <FormField
                    label="Location"
                    helper="Optional storage location."
                    value={editingStock.location}
                    onChange={(v) => handleEditingFieldChange("location", v)}
                  />
                  <FormField
                    label="Date of purchase"
                    type="date"
                    helper="Needed for accurate schedules."
                    value={editingStock.dateOfPurchase}
                    onChange={(v) =>
                      handleEditingFieldChange("dateOfPurchase", v)
                    }
                  />
                  <FormField
                    label="Quantity"
                    type="number"
                    required
                    helper="Units currently on hand."
                    value={String(editingStock.quantity)}
                    onChange={(v) => handleEditingFieldChange("quantity", v, true)}
                  />
                  {showEditBarcodeField || editingStock.barcode ? (
                    <FormField
                      label="Barcode / SKU"
                      helper="Scan or paste if you track codes."
                      value={editingStock.barcode || ""}
                      onChange={(v) => handleEditingFieldChange("barcode", v)}
                    />
                  ) : null}
                  <FormField
                    label="Reorder point"
                    type="number"
                    helper="Alert threshold."
                    value={String(editingStock.reorderPoint ?? "")}
                    onChange={(v) =>
                      handleEditingFieldChange("reorderPoint", v, true)
                    }
                  />
                  <FormField
                    label="Asset life (years)"
                    type="number"
                    helper="Straight-line period."
                    value={String(editingStock.assetLifeYears ?? "")}
                    onChange={(v) =>
                      handleEditingFieldChange("assetLifeYears", v, true)
                    }
                  />
                  <FormField
                    label="Residual value"
                    type="number"
                    helper="Expected salvage."
                    value={String(editingStock.residualValue ?? "")}
                    onChange={(v) =>
                      handleEditingFieldChange("residualValue", v, true)
                    }
                  />
                  <FormField
                    label="Last audit date"
                    type="date"
                    helper="Last walkthrough or count."
                    value={editingStock.lastAuditDate || ""}
                    onChange={(v) =>
                      handleEditingFieldChange("lastAuditDate", v)
                    }
                  />
                  <FormField
                    label="Vendor name"
                    helper="Supplier or manufacturer."
                    value={editingStock.vendor?.name || ""}
                    onChange={(v) => handleEditVendorField("name", v)}
                  />
                  <FormField
                    label="Vendor score"
                    type="number"
                    helper="0–100 quality indicator."
                    value={String(editingStock.vendor?.score ?? "")}
                    onChange={(v) => handleEditVendorField("score", v, true)}
                  />
                  <FormField
                    label="Vendor contact"
                    className="md:col-span-2"
                    helper="Optional email, Slack, or phone."
                    value={editingStock.vendor?.contact || ""}
                    onChange={(v) => handleEditVendorField("contact", v)}
                  />
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">
                      Notes
                    </label>
                    <p className="text-xs text-gray-400 mb-1">
                      Share storage instructions or audit history.
                    </p>
                    <textarea
                      value={editingStock.notes || ""}
                      onChange={(e) =>
                        handleEditingFieldChange("notes", e.target.value)
                      }
                      rows={3}
                      className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStock(null)}
                    className="px-4 py-2 rounded-xl border bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:opacity-90 transition"
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scheduleStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                Depreciation schedule
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {scheduleStock.productName}
              </p>
              <div className="space-y-3">
                {buildDepreciationSchedule(scheduleStock).map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2 text-sm"
                  >
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-semibold text-indigo-600">
                      {formatCurrency(row.bookValue, currency, locale)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setScheduleStock(null)}
                className="mt-5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-indigo-300 transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
  step,
  className = "",
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  className?: string;
  helper?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      {helper && <p className="text-xs text-gray-400 mt-0.5">{helper}</p>}
      <input
        type={type}
        step={step}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-300 transition-all"
      />
    </div>
  );
}

function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setScannerError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    let controls: { stop: () => void } | null = null;
    let requestStop = false;
    const stop = () => {
      if (controls) {
        controls.stop();
      } else {
        requestStop = true;
      }
    };
    const reader = new BrowserMultiFormatReader();
    const target = videoRef.current;

    if (!target) {
      setScannerError("Camera preview unavailable.");
      return;
    }

    reader
      .decodeFromVideoDevice(undefined, target, (result, error) => {
        if (!mounted) return;
        if (result) {
          onDetected(result.getText());
          stop();
        }
        if (error && error.name !== "NotFoundException") {
          setScannerError("Unable to read barcode. Try steady lighting.");
        }
      })
      .then((ctrl) => {
        controls = ctrl;
        if (requestStop) {
          ctrl.stop();
        }
      })
      .catch(() => {
        setScannerError("Camera permission denied or unavailable.");
      });

    return () => {
      mounted = false;
      stop();
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Scan barcode
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Allow camera access and align the code within the frame.
        </p>
        <div className="rounded-2xl overflow-hidden border border-gray-200 mb-4">
          <video ref={videoRef} className="w-full h-64 object-cover" />
        </div>
        {scannerError && (
          <p className="text-sm text-rose-500 mb-3">{scannerError}</p>
        )}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-indigo-300 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default StockPage;
