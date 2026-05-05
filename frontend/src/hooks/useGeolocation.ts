"use client";
import { useEffect, useRef } from "react";
import { useARStore } from "@/lib/store";

export function useGeolocation() {
  const { setLocation, locationPermission } = useARStore();
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (locationPermission !== "granted" || !navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [locationPermission, setLocation]);
}
