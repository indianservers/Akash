import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens, ObserverLocation, StarWithPosition } from "@/types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) => {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        set({ user, tokens, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, tokens: null, isAuthenticated: false });
      },
    }),
    { name: "auth-store", partialize: (s) => ({ user: s.user, tokens: s.tokens, isAuthenticated: s.isAuthenticated }) }
  )
);

interface ARState {
  location: ObserverLocation | null;
  orientation: { alpha: number | null; beta: number | null; gamma: number | null } | null;
  selectedStar: StarWithPosition | null;
  visibleStars: StarWithPosition[];
  locationPermission: "prompt" | "granted" | "denied" | "unavailable";
  orientationPermission: "prompt" | "granted" | "denied" | "unavailable" | "requesting";
  isARMode: boolean;
  setLocation: (loc: ObserverLocation) => void;
  setOrientation: (o: { alpha: number | null; beta: number | null; gamma: number | null }) => void;
  setSelectedStar: (star: StarWithPosition | null) => void;
  setVisibleStars: (stars: StarWithPosition[]) => void;
  setLocationPermission: (s: ARState["locationPermission"]) => void;
  setOrientationPermission: (s: ARState["orientationPermission"]) => void;
  setARMode: (v: boolean) => void;
}

export const useARStore = create<ARState>((set) => ({
  location: null,
  orientation: null,
  selectedStar: null,
  visibleStars: [],
  locationPermission: "prompt",
  orientationPermission: "prompt",
  isARMode: false,
  setLocation: (loc) => set({ location: loc }),
  setOrientation: (o) => set({ orientation: o }),
  setSelectedStar: (star) => set({ selectedStar: star }),
  setVisibleStars: (stars) => set({ visibleStars: stars }),
  setLocationPermission: (s) => set({ locationPermission: s }),
  setOrientationPermission: (s) => set({ orientationPermission: s }),
  setARMode: (v) => set({ isARMode: v }),
}));
