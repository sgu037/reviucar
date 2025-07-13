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
          {/* Modern gradient background */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0 100% 50%)" />
              <stop offset="100%" stopColor="hsl(0 85% 40%)" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0 100% 55%)" />
              <stop offset="100%" stopColor="hsl(0 90% 45%)" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Outer ring */}
          <circle cx="32" cy="32" r="30" fill="url(#bgGradient)" filter="url(#shadow)" />
          <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
          
          {/* Inner circle */}
          <circle cx="32" cy="32" r="24" fill="url(#innerGradient)" />
          
          {/* Speedometer elements */}
          <g transform="translate(32, 32)">
            {/* Main arc */}
            <path
              d="M-14 0 A14 14 0 0 1 14 0"
              stroke="white"
              strokeWidth="2"
              fill="none"
              opacity="0.9"
            />
            
            {/* Speed marks */}
            <g stroke="white" strokeWidth="1.5" opacity="0.8">
              <line x1="-14" y1="0" x2="-12" y2="0" />
              <line x1="12" y1="0" x2="14" y2="0" />
              <line x1="-9.9" y1="-9.9" x2="-8.5" y2="-8.5" />
              <line x1="8.5" y1="-8.5" x2="9.9" y2="-9.9" />
              <line x1="0" y1="-14" x2="0" y2="-12" />
            </g>
            
            {/* Stylized "R" logo */}
            <g fill="white">
              {/* R vertical stem */}
              <rect x="-2" y="-6" width="2.5" height="12" rx="0.5" />
              
              {/* R top section */}
              <path d="M-2 -6 L4 -6 A4 4 0 0 1 4 -2 L1 -2 A1 1 0 0 0 1 -5 L-2 -5 Z" />
              
              {/* R middle bar */}
              <rect x="-2" y="-2.5" width="6" height="1.5" rx="0.3" />
              
              {/* R diagonal leg */}
              <path d="M4 -1 L7 5 L5.5 6 L2 0 Z" />
            </g>
            
            {/* Center point */}
            <circle cx="0" cy="2" r="1.2" fill="white" opacity="0.9" />
            
            {/* Decorative elements */}
            <circle cx="0" cy="0" r="18" fill="none" stroke="white" strokeWidth="0.3" opacity="0.2" />
          </g>
        </svg>
      </div>
      
      {/* Text logo */}
      {showText && (
        <span className={`font-heading font-semibold text-foreground tracking-tight ${textSizes[size]}`}>
          <span className="text-foreground font-bold">R</span>eviucar
        </span>
      )}
    </div>
  );
};