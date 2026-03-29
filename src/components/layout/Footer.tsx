"use client";

import Link from "next/link";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf9O2wlqjlcv1uUAe-cHGNDpH6iEq7FOvNqeUl5lwP3tKdAhA/viewform";

// Google Charts QR API (no key needed, generates a real scannable QR)
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(FEEDBACK_FORM_URL)}`;

export default function Footer() {
  return (
    <footer
      className="p-8 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-xs uppercase"
      style={{ borderTop: "2px solid var(--border-color)", color: "#ffffff" }}
    >
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 flex items-center justify-center font-display text-xl"
            style={{
              border: "2px solid var(--border-color-strong)",
              color: "var(--accent-color)",
            }}
          >
            SCC
          </div>
          <span className="font-bold" style={{ color: "#ffffff" }}>
            SERVICE COMMAND CENTER
          </span>
        </div>
        <div className="flex gap-4" style={{ color: "#ffffff" }}>
          <Link
            href="/know-more"
            className="hover:text-nasa-cyan transition-colors"
          >
            ABOUT
          </Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-nasa-cyan transition-colors"
          >
            SUBMIT TOOL
          </a>
          <a href="#" className="hover:text-nasa-cyan transition-colors">
            PRIVACY
          </a>
          <a href="#" className="hover:text-nasa-cyan transition-colors">
            TERMS
          </a>
        </div>
      </div>

      <div className="text-center md:text-right" style={{ color: "#ffffff" }}>
        <p>
          We would love to hear your thoughts or feedback on how we can improve
          your experience with VORTEX.
        </p>
        <p className="mt-2 font-bold text-nasa-cyan">HAVE A NICE DAY!</p>
      </div>

      {/* Real QR Code linking to feedback form */}
      <a
        href={FEEDBACK_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 block"
        style={{
          border: "2px solid var(--border-color-strong)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={QR_SRC}
          alt="Scan to open feedback form"
          width={64}
          height={64}
          className="w-16 h-16"
          style={{ imageRendering: "pixelated" }}
        />
      </a>
    </footer>
  );
}
