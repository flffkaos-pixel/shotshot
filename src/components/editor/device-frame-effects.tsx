"use client";
// ponytail: 2D floating device with soft shadow + tilt. Mimics CRED/Superlist advertorial feel.
// Pure CSS transform — no Three.js, no extra dependencies, fast export.

import * as React from "react";

const SHADOWS = {
  sm: "0 4px 12px -4px rgba(0,0,0,0.15)",
  md: "0 12px 24px -8px rgba(0,0,0,0.20)",
  lg: "0 24px 48px -16px rgba(0,0,0,0.30)",
  xl: "0 40px 80px -24px rgba(0,0,0,0.40)",
} as const;

export function deviceEffectsStyle(rotation = 0, shadow: keyof typeof SHADOWS = "lg") {
  return {
    transform: `rotate(${rotation}deg)`,
    boxShadow: SHADOWS[shadow],
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };
}

export function FloatingPhone({
  children,
  rotation = -4,
  shadow = "lg",
}: {
  children: React.ReactNode;
  rotation?: number;
  shadow?: keyof typeof SHADOWS;
}) {
  return (
    <div style={{ display: "inline-block", animation: "shotshot-float 6s ease-in-out infinite" }}>
      <div style={deviceEffectsStyle(rotation, shadow)}>{children}</div>
      <style>{`@keyframes shotshot-float { 0%,100%{transform:translateY(0) rotate(${rotation}deg)} 50%{transform:translateY(-8px) rotate(${rotation}deg)} }`}</style>
    </div>
  );
}
