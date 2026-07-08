import type { ReactNode } from "react";

interface OceanWavesProps {
  animated?: boolean;
}

function WaveLayer({
  driftDuration,
  heaveDuration,
  heaveAmount,
  driftDelay = "0s",
  heaveDelay = "0s",
  bottom,
  height,
  animated,
  children,
}: {
  driftDuration: string;
  heaveDuration: string;
  heaveAmount: string;
  driftDelay?: string;
  heaveDelay?: string;
  bottom: string;
  height: string;
  animated: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`ocean-wave-layer ${animated ? "ocean-wave-drift" : "ocean-wave-static"}`}
      style={{
        bottom,
        height,
        ["--wave-drift-duration" as string]: driftDuration,
        ["--wave-drift-delay" as string]: driftDelay,
        ["--wave-heave-duration" as string]: heaveDuration,
        ["--wave-heave-amount" as string]: heaveAmount,
        ["--wave-heave-delay" as string]: heaveDelay,
      }}
    >
      <div className={animated ? "ocean-wave-heave" : undefined}>{children}</div>
    </div>
  );
}

function TiledWave({
  width,
  height,
  crestY,
  amplitude,
  fill,
  opacity = 1,
}: {
  width: number;
  height: number;
  crestY: number;
  amplitude: number;
  fill: string;
  opacity?: number;
}) {
  const trough = crestY + amplitude;
  const mid = crestY + amplitude * 0.45;
  const d = [
    `M0,${crestY}`,
    `C${width * 0.12},${crestY - amplitude * 0.55} ${width * 0.28},${trough} ${width * 0.42},${mid}`,
    `C${width * 0.56},${crestY - amplitude * 0.2} ${width * 0.72},${trough} ${width * 0.86},${mid}`,
    `C${width * 0.94},${crestY - amplitude * 0.35} ${width * 0.98},${crestY} ${width},${crestY}`,
    `L${width},${height} L0,${height} Z`,
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${width * 2} ${height}`}
      preserveAspectRatio="none"
      className="ocean-wave-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`wave-fill-${crestY}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(240, 244, 255, 0.14)" />
          <stop offset="35%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(15, 23, 41, 0.85)" />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#wave-fill-${crestY})`} opacity={opacity} />
      <path d={d} fill={`url(#wave-fill-${crestY})`} opacity={opacity} transform={`translate(${width}, 0)`} />
    </svg>
  );
}

function FoamCrest({ width, height, crestY, animated }: { width: number; height: number; crestY: number; animated: boolean }) {
  const d = [
    `M0,${crestY}`,
    `Q${width * 0.1},${crestY - 10} ${width * 0.2},${crestY + 2}`,
    `Q${width * 0.35},${crestY - 14} ${width * 0.5},${crestY + 1}`,
    `Q${width * 0.65},${crestY - 12} ${width * 0.8},${crestY + 2}`,
    `Q${width * 0.9},${crestY - 8} ${width},${crestY}`,
  ].join(" ");

  return (
    <div
      className={`ocean-wave-foam-crest ${animated ? "ocean-wave-foam-shimmer" : ""}`}
      style={{ bottom: "22%", height: "12%" }}
    >
      <svg viewBox={`0 0 ${width * 2} ${height}`} preserveAspectRatio="none" className="ocean-wave-svg" aria-hidden="true">
        <path
          d={d}
          fill="none"
          stroke="rgba(222, 188, 110, 0.22)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={d}
          fill="none"
          stroke="rgba(222, 188, 110, 0.22)"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`translate(${width}, 0)`}
        />
        <path
          d={d}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform="translate(0, -3)"
        />
        <path
          d={d}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`translate(${width}, -3)`}
        />
      </svg>
    </div>
  );
}

export function OceanWaves({ animated = true }: OceanWavesProps) {
  const W = 1440;
  const H = 320;

  return (
    <div className="ocean-waves" aria-hidden="true">
      {/* Ambient horizon glow — ties waves to the glass UI palette */}
      <div className="ocean-horizon-glow" />

      <WaveLayer
        driftDuration="38s"
        heaveDuration="9s"
        heaveAmount="-5px"
        driftDelay="-8s"
        heaveDelay="-1.5s"
        bottom="-4%"
        height="48%"
        animated={animated}
      >
        <TiledWave
          width={W}
          height={H}
          crestY={148}
          amplitude={38}
          fill="rgba(26, 37, 64, 0.92)"
          opacity={0.95}
        />
      </WaveLayer>

      <WaveLayer
        driftDuration="26s"
        heaveDuration="6.5s"
        heaveAmount="-8px"
        driftDelay="-4s"
        heaveDelay="-0.8s"
        bottom="-2%"
        height="40%"
        animated={animated}
      >
        <TiledWave
          width={W}
          height={H}
          crestY={118}
          amplitude={32}
          fill="rgba(61, 82, 153, 0.72)"
          opacity={0.88}
        />
      </WaveLayer>

      <WaveLayer
        driftDuration="18s"
        heaveDuration="4.8s"
        heaveAmount="-11px"
        driftDelay="-12s"
        heaveDelay="-2.2s"
        bottom="0"
        height="34%"
        animated={animated}
      >
        <TiledWave
          width={W}
          height={H}
          crestY={92}
          amplitude={26}
          fill="rgba(80, 108, 181, 0.55)"
          opacity={0.82}
        />
      </WaveLayer>

      <WaveLayer
        driftDuration="14s"
        heaveDuration="3.6s"
        heaveAmount="-7px"
        driftDelay="-2s"
        heaveDelay="-0.4s"
        bottom="2%"
        height="26%"
        animated={animated}
      >
        <svg viewBox={`0 0 ${W * 2} ${H}`} preserveAspectRatio="none" className="ocean-wave-svg" aria-hidden="true">
          <defs>
            <linearGradient id="wave-surface-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(222, 188, 110, 0.18)" />
              <stop offset="18%" stopColor="rgba(240, 244, 255, 0.12)" />
              <stop offset="55%" stopColor="rgba(80, 108, 181, 0.38)" />
              <stop offset="100%" stopColor="rgba(15, 23, 41, 0.6)" />
            </linearGradient>
          </defs>
          {([0, W] as const).map((offset) => (
            <path
              key={offset}
              d={`M${offset},78 C${offset + W * 0.14},48 ${offset + W * 0.3},108 ${offset + W * 0.44},72 C${offset + W * 0.58},38 ${offset + W * 0.74},98 ${offset + W * 0.88},68 C${offset + W * 0.96},52 ${offset + W},68 ${offset + W},78 L${offset + W},${H} L${offset},${H} Z`}
              fill="url(#wave-surface-glass)"
              opacity={0.75}
            />
          ))}
        </svg>
      </WaveLayer>

      <FoamCrest width={W} height={120} crestY={68} animated={animated} />
    </div>
  );
}
