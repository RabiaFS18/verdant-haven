import { z } from "zod";

import { MAX_QTY_PER_ITEM } from "@/data/site";

/** Shared by the checkout form (browser) and the order endpoint (server). */
export const customerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-()]{10,18}$/, "Enter a phone number we can reach, e.g. 0300 1234567"),
  address: z.string().trim().min(8, "Enter your full street address").max(300),
  city: z.string().trim().min(2, "Enter your city").max(80),
  postalCode: z.string().trim().max(10, "Postal code is too long"),
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const orderInputSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(100),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
      }),
    )
    .min(1, "Your cart is empty")
    .max(40),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});
