"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit2, Check, X, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/shared/contexts/auth-context";
import { useEditMode } from "@/shared/contexts/edit-mode-context";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf9O2wlqjlcv1uUAe-cHGNDpH6iEq7FOvNqeUl5lwP3tKdAhA/viewform";



interface SiteConfig {
  footerTitle: string;
  footerSubtitle: string;
  footerAbout: string;
  footerSubmit: string;
  footerPrivacy: string;
  footerTerms: string;
  footerFeedback: string;
  footerSignoff: string;
  footerImage: string;
  qrUrl: string;
}

const DEFAULTS: SiteConfig = {
  footerTitle: "NASA",
  footerSubtitle: "NETWORK OPERATIONS & ASSURANCE CENTER",
  footerAbout: "ABOUT",
  footerSubmit: "SUBMIT TOOL",
  footerPrivacy: "PRIVACY",
  footerTerms: "TERMS",
  footerFeedback: "We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX.",
  footerSignoff: "HAVE A NICE DAY!",
  footerImage: "",
  qrUrl: FEEDBACK_FORM_URL,
};

export default function Footer() {
  const { user } = useAuth();
  const { isEditMode } = useEditMode();
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULTS);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showFooterPopup, setShowFooterPopup] = useState(false);
  const [footerPopupDraft, setFooterPopupDraft] = useState("");
  const [footerPopupImage, setFooterPopupImage] = useState("");

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
            footerSignoff: data.footerSignoff || DEFAULTS.footerSignoff,
            footerImage: data.footerImage || DEFAULTS.footerImage,
            qrUrl: data.qrUrl || DEFAULTS.qrUrl,
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
            className="w-10 h-10 flex items-center justify-center font-display text-xl shrink-0 relative"
            style={{
              border: "2px solid var(--border-color-strong)",
              color: "var(--accent-color)",
            }}
          >
            {cfg.footerImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={cfg.footerImage} alt="Footer Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="font-display text-xl" style={{ color: "var(--accent-color)" }}>{cfg.footerTitle}</span>
            )}
            {isEditMode && (
              <button
                onClick={() => { setFooterPopupDraft(cfg.footerTitle); setFooterPopupImage(cfg.footerImage); setShowFooterPopup(true); }}
                className="absolute -top-1 -right-1 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded text-[8px]"
                title="Edit Logo"
              >
                <Edit2 size={8} />
              </button>
            )}
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

      <div className="flex items-center gap-6 text-right ml-auto relative" style={{ color: "#ffffff" }}>
        <div>
          <p>
            <EditableText field="footerFeedback" value={cfg.footerFeedback} />
          </p>
          <div className="mt-1 relative group/fso inline-block">
            {editing === "footerSignoff" ? (
              <form onSubmit={(e) => { e.preventDefault(); saveField("footerSignoff"); }} className="inline-flex items-center gap-1">
                <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} className="bg-transparent outline-none font-bold font-mono text-xs uppercase" style={{ color: "var(--accent-color)", borderBottom: "1px solid var(--accent-color)", width: `${Math.max(draft.length, 8)}ch` }} autoFocus />
                <button type="submit" className="text-green-400 hover:text-green-300"><Check size={10} /></button>
                <button type="button" onClick={() => setEditing(null)} className="text-red-400 hover:text-red-300"><X size={10} /></button>
              </form>
            ) : (
              <p className="font-bold text-nasa-cyan">
                {cfg.footerSignoff}
                {isEditMode && (
                  <button onClick={() => startEdit("footerSignoff", cfg.footerSignoff)} className="ml-1 inline-flex p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/fso:opacity-100 transition-opacity" title="Edit Signoff"><Edit2 size={8} /></button>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Dynamic QR Code */}
        <a
          href={cfg.qrUrl}
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
            src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(cfg.qrUrl)}`}
            alt="Scan to open feedback form"
            width={64}
            height={64}
            className="w-16 h-16"
            style={{ imageRendering: "pixelated" }}
          />
        </a>
        {isEditMode && (
          <div className="absolute -bottom-5 right-2">
            {editing === "qrUrl" ? (
              <form onSubmit={(e) => { e.preventDefault(); saveField("qrUrl"); }} className="flex items-center gap-1">
                <input type="url" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="QR Link URL..." className="font-mono text-[10px] bg-black/80 outline-none px-1 py-0.5 rounded" style={{ color: "var(--accent-color)", borderBottom: "1px solid var(--accent-color)", width: "140px" }} autoFocus />
                <button type="submit" className="text-green-400 hover:text-green-300"><Check size={10} /></button>
                <button type="button" onClick={() => setEditing(null)} className="text-red-400 hover:text-red-300"><X size={10} /></button>
              </form>
            ) : (
              <button onClick={() => startEdit("qrUrl", cfg.qrUrl)} className="font-mono text-[9px] text-cyan-400 hover:text-cyan-300 bg-black/60 px-1 py-0.5 rounded" title="Edit QR Link">
                EDIT QR LINK
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Logo Edit Popup */}
      {showFooterPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFooterPopup(false)}>
          <div className="bg-gray-900 border border-cyan-400/40 rounded-xl p-6 w-80 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-display text-sm tracking-widest text-cyan-400 text-center">EDIT FOOTER LOGO</h4>
            {/* Image Upload */}
            <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-3 flex flex-col items-center gap-2">
              {footerPopupImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={footerPopupImage} alt="Preview" className="max-h-16 max-w-full object-contain" />
                  <button onClick={() => setFooterPopupImage("")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Upload size={20} />
                  <span className="font-mono text-[10px]">UPLOAD IMAGE</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { alert("Max 2 MB"); return; }
                    const reader = new FileReader();
                    reader.onload = () => setFooterPopupImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </label>
              )}
            </div>
            {/* Text input (hidden when image set) */}
            {!footerPopupImage && (
              <input type="text" value={footerPopupDraft} onChange={(e) => setFooterPopupDraft(e.target.value)} placeholder="Title text (e.g. NASA)" className="w-full bg-transparent border-b border-cyan-400/40 outline-none font-display text-center text-xl py-1" style={{ color: "var(--accent-color)" }} />
            )}
            <button
              onClick={async () => {
                const updates: Record<string, string> = {};
                if (footerPopupImage) { updates.footerImage = footerPopupImage; } else { updates.footerImage = ""; updates.footerTitle = footerPopupDraft.trim() || cfg.footerTitle; }
                setCfg(prev => ({ ...prev, ...updates }));
                try { await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) }); } catch { /* ignore */ }
                setShowFooterPopup(false);
              }}
              className="w-full py-2 rounded-lg font-display text-sm tracking-widest bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 transition-colors"
            >
              APPLY
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
