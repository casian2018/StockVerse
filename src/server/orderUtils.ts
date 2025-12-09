import { ObjectId } from "mongodb";
import type { WithId } from "mongodb";
import type {
  OrderColorMode,
  OrderFilePayload,
  OrderRecord,
} from "@/lib/orders";

export const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024; // 6MB
export const MAX_ATTACHMENT_COUNT = 6;
export const MAX_PROOF_COUNT = 10;
const DATA_URL_PREFIX = /^data:[\w/+.-]+;base64,/i;

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function clipText(value: unknown, max = 256) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function normalizeColors(
  mode: OrderColorMode,
  raw: unknown
): string[] {
  const colors = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const cleaned = colors
    .map((color) => (typeof color === "string" ? color.trim() : ""))
    .filter(Boolean)
    .map((color) => (color.startsWith("#") ? color : `#${color}`))
    .map((color) => color.toUpperCase());

  if (!cleaned.length) {
    return mode === "mono" ? ["#000000"] : ["#000000", "#FFFFFF"];
  }

  const limit = mode === "mono" ? 1 : 6;
  const sliced = cleaned.slice(0, limit);

  sliced.forEach((color) => {
    if (!HEX_COLOR.test(color)) {
      throw new Error("Provide valid hex colors (e.g., #2F80ED).");
    }
  });

  if (mode === "mono" && sliced.length !== 1) {
    return [sliced[0]];
  }

  return sliced;
}

interface SanitizeOptions {
  maxItems?: number;
  now: string;
  uploadedBy: string;
}

export function sanitizeIncomingFiles(
  payload: unknown,
  options: SanitizeOptions
): OrderFilePayload[] {
  if (!payload) return [];
  if (!Array.isArray(payload)) {
    throw new Error("Attachments must be provided as an array.");
  }

  if (payload.length === 0) return [];

  const maxItems = options.maxItems ?? MAX_ATTACHMENT_COUNT;
  if (payload.length > maxItems) {
    throw new Error(`Upload up to ${maxItems} files at once.`);
  }

  return payload.map((entry) => sanitizeFile(entry, options));
}

function sanitizeFile(
  entry: unknown,
  options: SanitizeOptions
): OrderFilePayload {
  if (!entry || typeof entry !== "object") {
    throw new Error("One of the files is malformed.");
  }

  const { id, name, type, dataUrl } = entry as Partial<OrderFilePayload>;

  if (!id || typeof id !== "string") {
    throw new Error("Every file must include an id.");
  }

  if (!name || typeof name !== "string") {
    throw new Error("Every file must include a name.");
  }

  if (!type || typeof type !== "string") {
    throw new Error("Every file must include a MIME type.");
  }

  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Every file must include base64 data.");
  }

  if (!DATA_URL_PREFIX.test(dataUrl.slice(0, 30))) {
    throw new Error("One of the files is not a valid base64 payload.");
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("One of the files is not a valid base64 payload.");
  }

  const base64 = dataUrl.slice(commaIndex + 1);
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("Each file must be 6MB or smaller.");
  }

  if (
    !type.startsWith("image/") &&
    type !== "application/pdf" &&
    type !== "image/svg+xml"
  ) {
    throw new Error("Only images or PDFs are supported right now.");
  }

  return {
    id,
    name: clipText(name, 120),
    type,
    dataUrl,
    size: buffer.length,
    uploadedAt: options.now,
    uploadedBy: options.uploadedBy,
  };
}

export function serializeOrder(
  doc: WithId<Record<string, unknown>>
): OrderRecord {
  const { _id, ...rest } = doc;
  return {
    ...(rest as Omit<OrderRecord, "_id">),
    _id: _id.toString(),
  };
}

export function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORD-${random}`;
}

export function ensureObjectId(id?: string) {
  if (!id) throw new Error("Missing order id");
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid order id");
  }
  return new ObjectId(id);
}
