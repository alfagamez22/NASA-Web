import TBAReport from "@/components/sections/TBAReport";

export const metadata = {
  title: "Inside Vortex — SCC RAN Portal",
};

export default function InsideVortexPage() {
  return (
    <TBAReport
      title="WHATS INSIDE THE VORTEX"
      videoSrc="/laserflow.webm"
      objectPosition="50% 100%"
    />
  );
}
