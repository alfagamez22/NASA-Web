// import TrackerSection from "@/domains/tracker/components/TrackerSection";
//
// export const metadata = {
//   title: "Tracker — SCC RAN Portal",
//   description: "ASGARD site tracker and resource management.",
// };
//
// export default function TrackerPage() {
//   return <TrackerSection />;
// }

import { notFound } from "next/navigation";

// TRACKER page is temporarily disabled
export default function TrackerPage() {
  return notFound();
}
