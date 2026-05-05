"use client";
import { useState, useCallback } from "react";
import { useARStore } from "@/lib/store";

type PermissionStatus = "prompt" | "granted" | "denied" | "unavailable" | "requesting";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function useSensorPermissions() {
  const { setLocation, setLocationPermission, setOrientationPermission } = useARStore();
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>("prompt");
  const [orientationStatus, setOrientationStatus] = useState<PermissionStatus>("prompt");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationStatus("unavailable");
        setLocationPermission("unavailable");
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      setLocationStatus("requesting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude ?? undefined,
          });
          setLocationStatus("granted");
          setLocationPermission("granted");
          resolve(pos);
        },
        (err) => {
          const status = err.code === 1 ? "denied" : "unavailable";
          setLocationStatus(status);
          setLocationPermission(status);
          setError(
            err.code === 1
              ? "Location access denied. Please enable location in your browser settings."
              : "Unable to determine location. Please try again."
          );
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [setLocation, setLocationPermission]);

  const requestOrientation = useCallback(async (): Promise<boolean> => {
    if (typeof DeviceOrientationEvent === "undefined") {
      setOrientationStatus("unavailable");
      setOrientationPermission("unavailable");
      return false;
    }

    setOrientationStatus("requesting");
    setOrientationPermission("requesting");

    // iOS 13+ requires explicit permission request
    if (isIOS() && typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      try {
        const result = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (result === "granted") {
          setOrientationStatus("granted");
          setOrientationPermission("granted");
          return true;
        } else {
          setOrientationStatus("denied");
          setOrientationPermission("denied");
          setError("Motion access denied. Go to Settings > Safari > Motion & Orientation Access.");
          return false;
        }
      } catch {
        setOrientationStatus("denied");
        setOrientationPermission("denied");
        setError("Could not request motion permission. Tap the button again to try.");
        return false;
      }
    }

    // Android / desktop: just test if events fire
    return new Promise((resolve) => {
      let resolved = false;
      const test = () => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener("deviceorientation", test);
          setOrientationStatus("granted");
          setOrientationPermission("granted");
          resolve(true);
        }
      };

      window.addEventListener("deviceorientation", test, { once: true });

      // If no event fires within 2s, mark as unavailable
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener("deviceorientation", test);
          setOrientationStatus("unavailable");
          setOrientationPermission("unavailable");
          resolve(false);
        }
      }, 2000);
    });
  }, [setOrientationPermission]);

  const requestAll = useCallback(async () => {
    setError(null);
    let locOk = false;
    let orientOk = false;

    try {
      await requestLocation();
      locOk = true;
    } catch {
      locOk = false;
    }

    try {
      orientOk = await requestOrientation();
    } catch {
      orientOk = false;
    }

    return { location: locOk, orientation: orientOk };
  }, [requestLocation, requestOrientation]);

  return {
    locationStatus,
    orientationStatus,
    error,
    requestLocation,
    requestOrientation,
    requestAll,
    isIOS: isIOS(),
  };
}
