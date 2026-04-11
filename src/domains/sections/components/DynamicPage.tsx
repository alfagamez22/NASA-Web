"use client";

import KnowMoreSection from "./KnowMoreSection";
import RegionalReportSection from "@/domains/reports/components/RegionalReportSection";
import TeamDriveSection from "@/domains/drive/components/TeamDriveSection";
import InsideVortexSection from "@/domains/vortex/components/InsideVortexSection";
import TeamSection from "@/domains/teams/components/TeamSection";
import HomeSection from "./HomeSection";
import ReportSection from "@/domains/reports/components/ReportSection";

interface DynamicPageProps {
  format: string;
  slug: string;
  title: string;
}

/**
 * Renders the appropriate page component based on format.
 *
 * A = Card-based content sections (Know More pattern)
 * B = Regional report / slide layout
 * C = Know More / documentation layout (same as A)
 * D = Team / directory layout
 * E = Drive / file-link layout
 * F = Vortex / media gallery layout
 */
export default function DynamicPage({ format, slug, title }: DynamicPageProps) {
  switch (format) {
    case "A":
    case "C":
      return <KnowMoreSection parentSlug={slug} pageTitle={title} />;
    case "B":
      return <RegionalReportSection reportType={title} moduleSlug={slug} />;
    case "D":
      return <TeamSection />;
    case "E":
      return <TeamDriveSection />;
    case "F":
      return <InsideVortexSection />;
    default:
      return <KnowMoreSection parentSlug={slug} pageTitle={title} />;
  }
}
