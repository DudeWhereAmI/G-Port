import React from "react";

interface GPortLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "horizontal" | "vertical";
  className?: string;
  theme?: "light" | "dark";
}

export const GPortEmblem = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Globe clipping path */}
        <clipPath id="gport-globe-clip">
          <circle cx="250" cy="225" r="195" />
        </clipPath>

        {/* Globe radial sky gradient */}
        <radialGradient id="gport-sky" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E9F4F9" />
          <stop offset="100%" stopColor="#CEE6F3" />
        </radialGradient>

        {/* Ocean gradient */}
        <linearGradient id="gport-ocean" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3E94C4" />
          <stop offset="45%" stopColor="#2D80AB" />
          <stop offset="100%" stopColor="#1B557A" />
        </linearGradient>

        {/* G-Ship hull gradient */}
        <linearGradient id="gport-hull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#256787" />
          <stop offset="60%" stopColor="#1E5572" />
          <stop offset="100%" stopColor="#154158" />
        </linearGradient>

        {/* Mint wave gradient */}
        <linearGradient id="gport-mint-wave" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B4EBD5" />
          <stop offset="100%" stopColor="#82D6B5" />
        </linearGradient>

        {/* Leaf gradient */}
        <linearGradient id="gport-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6CBE4F" />
          <stop offset="60%" stopColor="#4FA03A" />
          <stop offset="100%" stopColor="#3B7F28" />
        </linearGradient>
      </defs>

      {/* Outer Navy Ring */}
      <circle cx="250" cy="225" r="218" stroke="#16385C" strokeWidth="26" fill="none" />
      
      {/* Inner Globe Background */}
      <circle cx="250" cy="225" r="206" fill="url(#gport-sky)" />

      {/* Clipped Globe & Ocean Layer */}
      <g clipPath="url(#gport-globe-clip)">
        {/* Globe Grid Lines (Latitudes & Longitudes) */}
        <g stroke="#92BCD5" strokeWidth="1.8" fill="none" opacity="0.85">
          <ellipse cx="250" cy="65" rx="120" ry="25" />
          <ellipse cx="250" cy="115" rx="165" ry="38" />
          <ellipse cx="250" cy="170" rx="190" ry="48" />
          <ellipse cx="250" cy="225" rx="195" ry="52" />
          
          <line x1="250" y1="30" x2="250" y2="420" />
          <path d="M 250 30 Q 185 225 250 420" />
          <path d="M 250 30 Q 315 225 250 420" />
          <path d="M 250 30 Q 120 225 250 420" />
          <path d="M 250 30 Q 380 225 250 420" />
          <path d="M 250 30 Q 60 225 250 420" />
          <path d="M 250 30 Q 440 225 250 420" />
        </g>

        {/* Ocean Body */}
        <rect x="40" y="248" width="420" height="180" fill="url(#gport-ocean)" />

        {/* Caustic Water Patterns */}
        <g fill="#5FBCE6" opacity="0.4">
          <ellipse cx="110" cy="275" rx="22" ry="7" />
          <ellipse cx="155" cy="268" rx="16" ry="5" />
          <ellipse cx="210" cy="280" rx="28" ry="8" />
          <ellipse cx="270" cy="270" rx="20" ry="6" />
          <ellipse cx="340" cy="275" rx="25" ry="7" />
          <ellipse cx="395" cy="282" rx="18" ry="6" />

          <ellipse cx="90" cy="305" rx="28" ry="9" />
          <ellipse cx="140" cy="320" rx="22" ry="8" />
          <ellipse cx="195" cy="310" rx="32" ry="10" />
          <ellipse cx="280" cy="325" rx="35" ry="11" />
          <ellipse cx="360" cy="315" rx="30" ry="9" />
          <ellipse cx="410" cy="325" rx="20" ry="7" />

          <ellipse cx="120" cy="360" rx="35" ry="12" />
          <ellipse cx="180" cy="375" rx="28" ry="10" />
          <ellipse cx="250" cy="380" rx="42" ry="13" />
          <ellipse cx="330" cy="370" rx="34" ry="11" />
          <ellipse cx="390" cy="380" rx="25" ry="9" />
        </g>

        <g fill="#A3E4FA" opacity="0.5">
          <path
            d="M 75 258 Q 105 252 135 258 Q 165 264 195 258 Q 225 252 255 258 Q 285 264 315 258 Q 345 252 375 258 Q 405 264 435 258"
            stroke="#7ED2F5"
            strokeWidth="2.5"
            fill="none"
          />
          <circle cx="160" cy="295" r="10" />
          <circle cx="230" cy="340" r="14" />
          <circle cx="310" cy="300" r="12" />
          <circle cx="370" cy="345" r="13" />
          <circle cx="130" cy="345" r="11" />
        </g>
      </g>

      {/* Central Emblem: The "G" Ship Hull & Sprouting Leaf */}
      <g>
        {/* Main "G" + Ship Hull */}
        <path
          d="M 285 105
             C 225 103 142 135 142 215
             C 142 300 205 348 290 348
             C 328 348 355 338 365 315
             L 365 240
             L 315 240
             L 315 265
             C 305 272 288 276 270 276
             C 220 276 195 245 195 215
             C 195 168 240 148 285 148
             C 305 148 322 152 335 160
             L 358 132
             C 338 116 314 105 285 105 Z"
          fill="url(#gport-hull)"
          stroke="#122F48"
          strokeWidth="11"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Cargo Container / Deck Bridge */}
        <path
          d="M 314 202
             L 352 202
             L 352 225
             L 314 225 Z"
          fill="#1E5470"
          stroke="#122F48"
          strokeWidth="9"
          strokeLinejoin="round"
        />
        {/* Cargo Accent / Bridge Window */}
        <rect x="324" y="210" width="18" height="8" rx="2" fill="#8CE0C0" />

        {/* Inner Wave in G loop */}
        <path
          d="M 198 238
             C 205 230 216 230 224 238
             C 232 246 244 246 252 238
             C 260 230 272 230 280 238
             L 280 252
             C 272 260 260 260 252 252
             C 244 244 232 244 224 252
             C 216 260 205 260 198 252 Z"
          fill="url(#gport-mint-wave)"
          stroke="#122F48"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Leaf Stem curving up from bridge */}
        <path
          d="M 300 200
             C 300 170 315 150 338 135
             C 345 130 350 125 355 118"
          fill="none"
          stroke="#122F48"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Green Leaf */}
        <path
          d="M 336 138
             C 330 100 350 72 385 64
             C 392 95 382 130 350 146
             C 344 145 339 142 336 138 Z"
          fill="url(#gport-leaf)"
          stroke="#122F48"
          strokeWidth="9"
          strokeLinejoin="round"
        />
        {/* Leaf Center Vein */}
        <path
          d="M 342 136
             C 358 115 368 95 382 68"
          fill="none"
          stroke="#122F48"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export const GPortLogo = ({
  size = "md",
  showText = true,
  variant = "horizontal",
  className = "",
  theme = "light"
}: GPortLogoProps) => {
  const iconDimensions = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }[size];

  const textSizes = {
    xs: "text-sm",
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-5xl"
  }[size];

  const gap = {
    xs: "gap-1.5",
    sm: "gap-2.5",
    md: "gap-3",
    lg: "gap-4",
    xl: "gap-5"
  }[size];

  const isVertical = variant === "vertical";

  return (
    <div
      className={`inline-flex items-center ${isVertical ? "flex-col text-center" : "flex-row"} ${gap} ${className}`}
    >
      <div className="relative shrink-0 flex items-center justify-center drop-shadow-sm">
        <GPortEmblem className={iconDimensions} />
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight font-extrabold select-none">
          <span
            className={`${textSizes} leading-none ${
              theme === "dark" ? "text-white" : "text-[#16385C]"
            }`}
          >
            G
          </span>
          <span
            className={`${textSizes} leading-none ${
              theme === "dark" ? "text-emerald-400" : "text-[#2B7AA3]"
            }`}
          >
            Port
          </span>
        </div>
      )}
    </div>
  );
};

export default GPortLogo;
