import { SITE } from "@/data/site";

export const ORDER_STATUSES = [
  "processing",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  processing: "bg-terracotta/15 text-terracotta",
  confirmed: "bg-secondary text-secondary-foreground",
  shipped: "bg-soft-sage text-primary",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const dateTime = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/** 0300-1234567 → 923001234567, the format wa.me expects. */
export function whatsappNumber(phone: string | null | undefined) {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return digits.length >= 11 ? digits : undefined;
}

export function whatsappUrl(phone: string | null | undefined, text: string) {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : undefined;
}

export const orderMessage = (name: string, orderNumber: string, total: number) =>
  `Assalam o Alaikum ${name}, aap ka ${SITE.name} order ${orderNumber} (Rs ${Math.round(total).toLocaleString("en-PK")}) mil gaya hai. Kya aap apna address aur delivery ka waqt confirm kar denge? Shukriya!`;
