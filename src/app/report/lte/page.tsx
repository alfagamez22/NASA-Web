import RegionalReportSection from "@/components/sections/RegionalReportSection";

export const metadata = {
  title: "LTE Report — SCC RAN Portal",
};

export default function ReportLTEPage() {
  return <RegionalReportSection reportType="LTE" moduleSlug="report-lte" />;
}
