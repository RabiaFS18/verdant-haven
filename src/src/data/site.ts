export const SITE = {
  name: "Verdant Haven",
  tagline: "Curated plants for modern spaces",
  email: "rabiashahid20018@gmail.com",
  phone: "03207886509",
  whatsapp: "923207886509",
  hours: "Mon–Sat, 9am–6pm",
} as const;

/** Delivery rules — also sent to the database function that prices orders. */
export const FREE_DELIVERY_THRESHOLD = 2000;
export const DELIVERY_FEE = 50;
export const MAX_QTY_PER_ITEM = 10;

export const navLinks = [
  { label: "Shop all", to: "/shop" },
  { label: "Indoor plants", to: "/indoor-plants" },
  { label: "Outdoor plants", to: "/outdoor-plants" },
  { label: "Seeds", to: "/seeds" },
  { label: "Pots & care", to: "/pots-care" },
  { label: "Plant care guide", to: "/plant-care-guide" },
  { label: "About us", to: "/about" },
] as const;

/**
 * Customer quotes. Replace with real, permission-granted reviews.
 * The carousel hides its controls automatically when there is only one.
 */
export const testimonials = [
  {
    quote: "My Monstera arrived healthier than any plant I’ve ever brought home.",
    author: "Maya R.",
    note: "Verified buyer",
  },
] as const;
