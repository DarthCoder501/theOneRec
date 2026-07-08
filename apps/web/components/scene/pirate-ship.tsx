interface PirateShipProps {
  className?: string;
  animated?: boolean;
}

/** Decorative stylized pirate ship — generic design, not a licensed character asset. */
export function PirateShip({ className = "", animated = true }: PirateShipProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? "ocean-ship-animated" : ""}`}
      aria-hidden="true"
    >
      {/* Hull shadow on water */}
      <ellipse cx="120" cy="162" rx="72" ry="8" fill="rgba(15, 23, 41, 0.45)" />

      {/* Hull */}
      <path
        d="M44 128 C52 118, 68 112, 120 110 C172 112, 188 118, 196 128 L188 142 C176 152, 148 158, 120 158 C92 158, 64 152, 52 142 Z"
        fill="#3d5299"
        stroke="#DEBC6E"
        strokeWidth="2"
      />
      <path
        d="M56 128 L184 128"
        stroke="#DEBC6E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Deck cabin */}
      <rect x="96" y="96" width="48" height="22" rx="3" fill="#2a3d78" stroke="#DEBC6E" strokeWidth="1.5" />
      <path d="M94 96 L120 82 L146 96" fill="#BB353B" stroke="#DEBC6E" strokeWidth="1.5" />

      {/* Portholes */}
      <circle cx="72" cy="132" r="4" fill="#DEBC6E" opacity="0.85" />
      <circle cx="88" cy="134" r="4" fill="#DEBC6E" opacity="0.85" />
      <circle cx="152" cy="134" r="4" fill="#DEBC6E" opacity="0.85" />
      <circle cx="168" cy="132" r="4" fill="#DEBC6E" opacity="0.85" />

      {/* Main mast */}
      <rect x="117" y="28" width="6" height="82" rx="2" fill="#8B6914" />
      <rect x="108" y="24" width="24" height="6" rx="2" fill="#8B6914" />

      {/* Main sail */}
      <path
        d="M123 34 C148 38, 162 52, 168 78 C162 84, 148 88, 123 90 Z"
        fill="rgba(240, 244, 255, 0.92)"
        stroke="#DEBC6E"
        strokeWidth="1.5"
      />
      {/* Emblem on sail */}
      <circle cx="145" cy="58" r="10" fill="none" stroke="#506CB5" strokeWidth="1.5" />
      <path d="M145 52 L145 64 M139 58 L151 58" stroke="#506CB5" strokeWidth="1.5" strokeLinecap="round" />

      {/* Fore sail */}
      <path
        d="M123 38 C108 42, 98 54, 94 72 C100 76, 110 78, 123 80 Z"
        fill="rgba(187, 53, 59, 0.75)"
        stroke="#DEBC6E"
        strokeWidth="1.5"
      />

      {/* Flag */}
      <path d="M120 28 L120 14" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M120 14 L148 20 L120 26 Z"
        fill="#BB353B"
        stroke="#DEBC6E"
        strokeWidth="1"
      />
      <circle cx="132" cy="20" r="2.5" fill="#DEBC6E" />

      {/* Bowsprit */}
      <path d="M44 128 L28 118" stroke="#8B6914" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M28 118 C22 112, 18 108, 14 104"
        stroke="#DEBC6E"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cannon */}
      <rect x="60" y="122" width="14" height="5" rx="2" fill="#1a2540" stroke="#DEBC6E" strokeWidth="1" />
    </svg>
  );
}
