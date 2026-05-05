"use client";
import { useState } from "react";
import { useSensorPermissions } from "@/hooks/useSensorPermissions";
import { useARStore } from "@/lib/store";

export function RuntimePermissionButton() {
  const { requestAll, error } = useSensorPermissions();
  const { locationPermission, orientationPermission, setARMode } = useARStore();
  const [requesting, setRequesting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const secureContext =
    typeof window === "undefined" ||
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const ready = locationPermission === "granted" && orientationPermission === "granted";
  if (ready) return null;
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="absolute right-3 top-24 z-30 rounded-full border border-star-blue/30 bg-black/55 px-3 py-2 text-xs font-semibold text-star-blue backdrop-blur-md"
      >
        Enable sensors
      </button>
    );
  }

  return (
    <div className="absolute left-3 right-3 top-24 z-30 md:left-auto md:right-4 md:w-80">
      <div className="object-mini-card rounded-lg p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-star-white">Enable live sky alignment</p>
          <button type="button" onClick={() => setCollapsed(true)} className="text-xs text-white/45 hover:text-white">
            Collapse
          </button>
        </div>
        <p className="mt-1 text-xs text-white/45">
          Allow location and motion sensors to align the planetarium with your phone.
        </p>
        {!secureContext && (
          <p className="mt-2 rounded-md border border-star-gold/30 bg-star-gold/10 p-2 text-xs text-star-gold">
            Mobile browsers block location on plain HTTP LAN pages. Open the HTTPS LAN URL, then tap this button.
          </p>
        )}
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        <button
          type="button"
          disabled={requesting || !secureContext}
          onClick={async () => {
            setRequesting(true);
            const result = await requestAll();
            setARMode(result.location && result.orientation);
            setRequesting(false);
          }}
          className="mt-3 w-full rounded-md bg-star-blue py-3 text-sm font-bold text-space-950 disabled:opacity-60"
        >
          {requesting ? "Requesting..." : secureContext ? "Allow location & sensors" : "HTTPS required"}
        </button>
      </div>
    </div>
  );
}
