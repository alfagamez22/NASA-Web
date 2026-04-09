"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit2, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEditMode } from "@/lib/edit-mode-context";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf9O2wlqjlcv1uUAe-cHGNDpH6iEq7FOvNqeUl5lwP3tKdAhA/viewform";

// Google Charts QR API (no key needed, generates a real scannable QR)
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(FEEDBACK_FORM_URL)}`;

interface SiteConfig {
  footerTitle: string;
  footerSubtitle: string;
  footerAbout: string;
  footerSubmit: string;
  footerPrivacy: string;
  footerTerms: string;
  footerFeedback: string;
}

const DEFAULTS: SiteConfig = {
  footerTitle: "NASA",
  footerSubtitle: "NETWORK OPERATIONS & ASSURANCE CENTER",
  footerAbout: "ABOUT",
  footerSubmit: "SUBMIT TOOL",
  footerPrivacy: "PRIVACY",
  footerTerms: "TERMS",
  footerFeedback: "We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX.",
};

export default function Footer() {
  const { user } = useAuth();
  const { isEditMode } = useEditMode();
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULTS);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        if (res.ok) {
          const data = await res.json();
          setCfg({
            footerTitle: data.footerTitle || DEFAULTS.footerTitle,
            footerSubtitle: data.footerSubtitle || DEFAULTS.footerSubtitle,
            footerAbout: data.footerAbout || DEFAULTS.footerAbout,
            footerSubmit: data.footerSubmit || DEFAULTS.footerSubmit,
            footerPrivacy: data.footerPrivacy || DEFAULTS.footerPrivacy,
            footerTerms: data.footerTerms || DEFAULTS.footerTerms,
            footerFeedback: data.footerFeedback || DEFAULTS.footerFeedback,
          });
        }
      } catch { /* ignore */ }
    })();
  }, []);

  function startEdit(field: string, value: string) {
    setEditing(field);
    setDraft(value);
  }

  async function saveField(field: string) {
    const trimmed = draft.trim();
    if (!trimmed) { setEditing(null); return; }
    setCfg((prev) => ({ ...prev, [field]: trimmed }));
    try {
      await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: trimmed }) });
    } catch { /* ignore */ }
    setEditing(null);
  }

  function EditableText({ field, value, className, style }: { field: string; value: string; className?: string; style?: React.CSSProperties }) {
    if (editing === field) {
      return (
        <form onSubmit={(e) => { e.preventDefault(); saveField(field); }} className="inline-flex items-center gap-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="bg-transparent outline-none font-mono text-xs uppercase"
            style={{ ...style, borderBottom: "1px solid var(--accent-color)", minWidth: "60px", width: `${Math.max(draft.length, 4)}ch` }}
            autoFocus
          />
          <button type="submit" className="text-green-400 hover:text-green-300"><Check size={10} /></button>
          <button type="button" onClick={() => setEditing(null)} className="text-red-400 hover:text-red-300"><X size={10} /></button>
        </form>
      );
    }
    return (
      <span className={`relative group/ft ${className || ""}`} style={style}>
        {value}
        {isEditMode && (
          <button
            onClick={() => startEdit(field, value)}
            className="ml-1 inline-flex p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/ft:opacity-100 transition-opacity"
            title={`Edit ${field}`}
          >
            <Edit2 size={8} />
          </button>
        )}
      </span>
    );
  }

  return (
    <footer
      className="p-2 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-xs uppercase"
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
            <EditableText field="footerTitle" value={cfg.footerTitle} />
          </div>
          <EditableText field="footerSubtitle" value={cfg.footerSubtitle} className="font-bold" style={{ color: "#ffffff" }} />
        </div>
        <div className="flex gap-4" style={{ color: "#ffffff" }}>
          <Link
            href="/know-more"
            className="hover:text-nasa-cyan transition-colors"
          >
            <EditableText field="footerAbout" value={cfg.footerAbout} />
          </Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-nasa-cyan transition-colors"
          >
            <EditableText field="footerSubmit" value={cfg.footerSubmit} />
          </a>
          <a href="#" className="hover:text-nasa-cyan transition-colors">
            <EditableText field="footerPrivacy" value={cfg.footerPrivacy} />
          </a>
          <a href="#" className="hover:text-nasa-cyan transition-colors">
            <EditableText field="footerTerms" value={cfg.footerTerms} />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-6 text-right ml-auto" style={{ color: "#ffffff" }}>
        <div>
          <p>
            <EditableText field="footerFeedback" value={cfg.footerFeedback} />
          </p>
          <p className="mt-1 font-bold text-nasa-cyan">HAVE A NICE DAY!</p>
        </div>

        {/* Real QR Code linking to feedback form */}
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 block shrink-0"
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
      </div>
    </footer>
  );
}
