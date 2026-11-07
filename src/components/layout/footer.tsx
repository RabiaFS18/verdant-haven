import { Link } from "@tanstack/react-router";
import { Leaf, MessageCircle } from "lucide-react";

import { NewsletterForm } from "@/components/shop/newsletter-form";
import { SITE } from "@/data/site";

const social = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Facebook", href: "https://facebook.com" },
];

const linkClass = "transition-colors hover:text-footer-foreground";

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container-page py-16">
        <div className="grid gap-12 border-b border-footer-foreground/15 pb-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Leaf className="size-8 text-sage" aria-hidden="true" />
            <h2 className="mt-5 max-w-lg text-3xl sm:text-4xl">
              Get 10% off your first order + weekly care tips.
            </h2>
            <NewsletterForm />
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <nav aria-label="Shop">
              <p className="mb-4 font-bold">Shop</p>
              <div className="grid gap-3 text-footer-foreground/70">
                <Link to="/shop" className={linkClass}>
                  All plants
                </Link>
                <Link to="/indoor-plants" className={linkClass}>
                  Indoor plants
                </Link>
                <Link to="/outdoor-plants" className={linkClass}>
                  Outdoor plants
                </Link>
                <Link to="/seeds" className={linkClass}>
                  Seeds
                </Link>
                <Link to="/pots-care" className={linkClass}>
                  Pots &amp; care
                </Link>
              </div>
            </nav>
            <nav aria-label="Help">
              <p className="mb-4 font-bold">Help</p>
              <div className="grid gap-3 text-footer-foreground/70">
                <Link to="/plant-care-guide" hash="faq" className={linkClass}>
                  Plant care FAQs
                </Link>
                <Link to="/about" hash="guarantee" className={linkClass}>
                  Our guarantee
                </Link>
                <Link to="/about" hash="contact" className={linkClass}>
                  Contact us
                </Link>
                <a
                  href={`https://wa.me/${SITE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkClass} flex items-center gap-1.5`}
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp us
                </a>
              </div>
            </nav>
            <nav aria-label="Follow us">
              <p className="mb-4 font-bold">Follow</p>
              <div className="grid gap-3 text-footer-foreground/70">
                {social.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>
        <p className="pt-7 text-xs text-footer-foreground/70">
          © {new Date().getFullYear()} {SITE.name}. Grow something beautiful.
        </p>
      </div>
    </footer>
  );
}
