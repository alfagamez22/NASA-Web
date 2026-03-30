import type { Metadata } from "next";
import InsideVortexSection from "@/components/sections/InsideVortexSection";

export const metadata: Metadata = {
  title: "What's Inside the Vortex - SCC RAN Portal",
  description: "A cinematic guided breakdown of the VORTEX layers and modules.",
};

export default function InsideVortexPage() {
  return <InsideVortexSection />;
}
