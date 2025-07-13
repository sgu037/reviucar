import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const ReviuCarLogo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto",
    xl: "h-20 w-auto"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl", 
    xl: "text-4xl"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo SVG */}
      <div className={sizeClasses[size]}>
        <svg
          viewBox="0 0 64 64"
          className="h-full w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Red circle background */}
          <circle cx="32" cy="32" r="30" fill="hsl(0 100% 45%)" />
          
          {/* Speedometer arc */}
          <path
            d="M20 32 A12 12 0 0 1 44 32"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            opacity="0.9"
          />
          
          {/* Speedometer marks */}
          <g stroke="white" strokeWidth="1.5" opacity="0.8">
            <line x1="20" y1="32" x2="22" y2="32" />
            <line x1="42" y1="32" x2="44" y2="32" />
            <line x1="25.17" y1="25.17" x2="26.76" y2="26.76" />
            <line x1="37.24" y1="26.76" x2="38.83" y2="25.17" />
          </g>
          
          {/* Stylized "R" from speedometer needle */}
          <g fill="white">
            {/* R vertical line */}
            <rect x="30" y="28" width="2.5" height="16" />
            
            {/* R top horizontal */}
            <rect x="30" y="28" width="8" height="2.5" />
            
            {/* R middle horizontal */}
            <rect x="30" y="35" width="6" height="2.5" />
            
            {/* R diagonal */}
            <path d="M36 37.5 L40 44 L42.5 42.5 L37.5 35 Z" />
            
            {/* R top curve */}
            <path d="M38 28 A5 5 0 0 1 38 37.5 L35.5 37.5 A2.5 2.5 0 0 0 35.5 30.5 L38 30.5 Z" />
          </g>
          
          {/* Center dot */}
          <circle cx="32" cy="36" r="1.5" fill="white" />
        </svg>
      </div>
      
      {/* Text logo */}
      {showText && (
        <span className={`font-heading font-semibold text-foreground tracking-tight ${textSizes[size]}`}>
          reviucar
        </span>
      )}
    </div>
  );
};