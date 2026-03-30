"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Monitor, Search } from "lucide-react";
import { NAV_ITEMS } from "@/data/navigation";

import SearchModal from "./SearchModal";

export default function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  return (
    <>
      <nav className="sticky top-0 bg-nasa-darker z-50 flex flex-wrap items-stretch" style={{ borderBottom: "2px solid var(--border-color-strong)", backgroundColor: "var(--bg-secondary)" }}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 bg-nasa-blue text-nasa-light-cyan z-50 overflow-visible" style={{ borderRight: "2px solid var(--border-color-strong)", background: "linear-gradient(135deg, var(--bg-tertiary), var(--bg-card))", color: "var(--accent-light)" }}>
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            {/* The absolute positioning and max-w-none prevents the image from affecting the layout size */}
            <Image src="/broadcast.gif" alt="SCC RAN Logo" width={54} height={54} unoptimized className="absolute max-w-none object-contain" />
          </div>
          <span className="font-display text-2xl tracking-tighter z-10">SCC RAN</span>
        </div>

        {/* Nav Links */}
        <div className="flex flex-grow overflow-x-auto md:overflow-visible no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
            const navClasses = `px-6 py-4 font-display text-xl uppercase tracking-tighter transition-all whitespace-nowrap flex items-center h-full ${isActive
              ? "bg-nasa-blue text-nasa-light-cyan"
              : "text-nasa-gray hover:text-nasa-cyan hover:bg-nasa-blue hover:bg-opacity-50"
              }`;
            const navStyles = {
              borderRight: "2px solid var(--border-color)",
              color: isActive ? "var(--accent-light)" : "var(--text-secondary)",
              backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
            };

            if (item.subItems && item.subItems.length > 0) {
              return (
                <div key={item.label} className="relative group flex h-full">
                  <Link href={item.href} className={navClasses} style={navStyles}>
                    {item.display}
                  </Link>
                  {/* Dropdown Menu */}
                  <div
                    className="absolute left-0 top-full hidden group-hover:block min-w-full bg-nasa-darker z-[100] shadow-lg"
                    style={{ border: "2px solid var(--border-color-strong)", borderTop: "none" }}
                  >
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center px-6 py-3 font-display text-lg uppercase transition-all whitespace-nowrap text-nasa-gray hover:text-nasa-light-cyan hover:bg-nasa-blue"
                        style={{ borderBottom: "1px solid var(--border-color)" }}
                      >
                        {sub.display}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={navClasses}
                style={navStyles}
              >
                {item.display}
              </Link>
            );
          })}
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center gap-4 ml-auto text-nasa-cyan hover:text-nasa-light-cyan transition-colors" style={{ borderLeft: "2px solid var(--border-color)", color: "var(--accent-color)" }}>


          {/* Search Icon */}
          <Search
            size={20}
            className="cursor-pointer hover:scale-110 transition-transform"
            onClick={() => setIsSearchOpen(true)}
          />
        </div>
      </nav>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
