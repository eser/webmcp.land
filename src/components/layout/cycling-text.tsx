"use client";

import { useState, useEffect } from "react";

interface CyclingTextProps {
  items: string[];
  interval?: number;
  className?: string;
}

export function CyclingText({ items, interval = 2500, className = "" }: CyclingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [items, interval]);

  return (
    <span className="block overflow-visible">
      <span
        className={`animate-gradient-text inline-block transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${className}`}
        style={{
          background: "linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #f97316, #ef4444, #3b82f6)",
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          padding: "0.25em 0.15em",
          margin: "-0.25em -0.15em",
        }}
      >
        {items[currentIndex]}
      </span>
    </span>
  );
}
