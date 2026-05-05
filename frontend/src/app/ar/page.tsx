"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { PermissionFlow } from "@/components/ui/PermissionFlow";
import { useARStore } from "@/lib/store";
import Link from "next/link";

const FALLBACK_LOCATION = {
  lat: 28.6139,
  lon: 77.209,
  accuracy: 0,
};

// Dynamically import Three.js component to avoid SSR issues
const ARViewer = dynamic(() => import("@/components/ar/ARViewer").then((m) => ({ default: m.ARViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-space-950">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin-slow">✨</div>
        <p className="text-white/50 text-sm">Loading star data...</p>
      </div>
    </div>
  ),
});

export default function ARPage() {
  const [showAR, setShowAR] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const { setARMode, setLocation } = useARStore();

  const handleGranted = () => {
    setShowAR(true);
  };

  const handleSkip = () => {
    setIsManual(true);
    setARMode(false);
    setLocation(FALLBACK_LOCATION);
    setShowAR(true);
  };

  return (
    <div className="h-screen flex flex-col bg-space-950 overflow-hidden">
      {/* Top bar */}
      {showAR && (
        <div className="flex items-center justify-between px-4 py-3 z-20 bg-space-950/60 backdrop-blur-sm border-b border-white/5">
          <Link href="/" className="text-white/50 text-sm">← Home</Link>
          <span className="text-star-blue text-sm font-medium">
            {isManual ? "Manual Sky Map" : "AR Sky View"}
          </span>
          <Link href="/registry" className="text-white/50 text-sm">Registry</Link>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {!showAR ? (
          <PermissionFlow onGranted={handleGranted} onSkip={handleSkip} />
        ) : (
          <ARViewer initialStars={[]} />
        )}
      </div>

      {/* Bottom nav */}
      {showAR && (
        <div className="flex items-center justify-around px-6 py-4 bg-space-950/80 backdrop-blur-sm border-t border-white/5 safe-bottom z-20">
          <Link href="/registry" className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70">
            <span className="text-xl">🔍</span>
            <span className="text-xs">Search</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70">
            <span className="text-xl">👤</span>
            <span className="text-xs">My Stars</span>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70">
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
        </div>
      )}
    </div>
  );
}
