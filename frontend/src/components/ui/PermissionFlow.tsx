"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSensorPermissions } from "@/hooks/useSensorPermissions";
import { useARStore } from "@/lib/store";

interface Props {
  onGranted: () => void;
  onSkip: () => void;
}

type Step = "explain" | "checking" | "done" | "partial";

export function PermissionFlow({ onGranted, onSkip }: Props) {
  const { requestAll, locationStatus, orientationStatus, error } = useSensorPermissions();
  const { setARMode } = useARStore();
  const [step, setStep] = useState<Step>("explain");

  const handleStart = async () => {
    setStep("checking");
    const result = await requestAll();
    if (result.location && result.orientation) {
      setARMode(true);
      setStep("done");
      onGranted();
    } else if (result.location) {
      setStep("partial");
    } else {
      setStep("partial");
    }
  };

  const handleManual = () => {
    setStep("done");
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-space-950 flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-sm">
        <div className="text-6xl mb-6 animate-float">✨</div>
        <h1 className="text-3xl font-bold text-star-white mb-3">AR Star Registry</h1>
        <p className="text-white/60 mb-8 leading-relaxed">
          Point your phone toward the sky to see real stars and constellations aligned with the
          actual night sky.
        </p>

        {step === "explain" && (
          <>
            <div className="bg-space-800/60 border border-white/10 rounded-2xl p-4 mb-6 text-left">
              <p className="text-white/80 text-sm mb-3">AR Star Registry needs:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>📍</span>
                  <span>Your location — to show stars for your position</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>🧭</span>
                  <span>Motion & orientation — to align stars with the sky</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleStart}
              className="w-full bg-star-blue text-space-950 font-bold py-4 rounded-2xl text-lg mb-3"
            >
              Start AR Sky View
            </button>
            <button onClick={handleManual} className="w-full text-white/50 py-3 text-sm">
              Continue with Manual Sky Map
            </button>
          </>
        )}

        {step === "checking" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <StatusDot status={locationStatus} />
              <span className="text-white/70">Location access</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <StatusDot status={orientationStatus} />
              <span className="text-white/70">Motion & orientation access</span>
            </div>
            <p className="text-white/40 text-xs mt-4">
              Please respond to the permission prompts above...
            </p>
          </div>
        )}

        {step === "partial" && (
          <>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <StatusDot status={locationStatus} />
                <span className="text-white/70">Location access</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <StatusDot status={orientationStatus} />
                <span className="text-white/70">Motion & orientation access</span>
              </div>
            </div>
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 mb-4 text-red-300 text-sm">
                {error}
              </div>
            )}
            <button onClick={handleManual} className="w-full bg-white/10 text-star-white py-4 rounded-2xl font-semibold mb-3">
              Use Manual Sky Map
            </button>
            <button onClick={handleStart} className="w-full text-star-blue text-sm py-2">
              Try Again
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    prompt: "bg-white/30",
    requesting: "bg-yellow-400 animate-pulse",
    granted: "bg-green-400",
    denied: "bg-red-400",
    unavailable: "bg-orange-400",
  };
  return (
    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors[status] ?? "bg-white/30"}`} />
  );
}
