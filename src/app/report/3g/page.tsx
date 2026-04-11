import RegionalReportSection from "@/domains/reports/components/RegionalReportSection";

export const metadata = {
  title: "3G Report — SCC RAN Portal",
};

export default function Report3GPage() {
  return <RegionalReportSection reportType="3G" moduleSlug="report-3g" />;
}
