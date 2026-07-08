"use client";

import { useEffect, useState } from "react";
import { OceanWaves } from "./ocean-waves";
import { PirateShip } from "./pirate-ship";

export function OceanScene() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const animated = !reducedMotion;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 ocean-bg" />
      <OceanWaves animated={animated} />
      <div className="ocean-ship-container">
        <PirateShip animated={animated} className="ocean-ship" />
      </div>
    </div>
  );
}
