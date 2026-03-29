import RegionalReportSection from "@/components/sections/RegionalReportSection";

export const metadata = {
  title: "2G Report — SCC RAN Portal",
};

export default function Report2GPage() {
  return <RegionalReportSection reportType="2G" moduleSlug="report-2g" />;
}
