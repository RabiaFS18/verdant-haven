import { SITE } from "@/data/site";

type PageHeadInput = { title: string; description: string; image?: string };

const siteUrl = (import.meta.env["VITE_SITE_URL"] as string | undefined)?.replace(/\/$/, "");

/** Social previews need absolute URLs, so images are only emitted once VITE_SITE_URL is set. */
export const absoluteUrl = (path: string) => (siteUrl ? `${siteUrl}${path}` : undefined);

/** Shared <head> metadata so every route gets consistent titles and social tags. */
export function pageHead({ title, description, image }: PageHeadInput) {
  const fullTitle = title === SITE.name ? title : `${title} — ${SITE.name}`;
  const imageUrl = image ? absoluteUrl(image) : undefined;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      ...(imageUrl
        ? [
            { property: "og:image", content: imageUrl },
            { name: "twitter:image", content: imageUrl },
          ]
        : []),
    ],
  };
}
