import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TintIntensity = "subtle" | "standard" | "vibrant";

const SCALES: Record<TintIntensity, number> = {
  subtle: 0.8,
  standard: 1.8,
  vibrant: 2.8,
};

const STORAGE_KEY = "korelumina:glass-tint";

interface Ctx {
  intensity: TintIntensity;
  setIntensity: (v: TintIntensity) => void;
}

const GlassTintContext = createContext<Ctx | null>(null);

export function GlassTintProvider({ children }: { children: ReactNode }) {
  const [intensity, setIntensity] = useState<TintIntensity>(() => {
    if (typeof window === "undefined") return "standard";
    const stored = window.localStorage.getItem(STORAGE_KEY) as TintIntensity | null;
    return stored && stored in SCALES ? stored : "standard";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--glass-tint-scale", String(SCALES[intensity]));
    document.documentElement.dataset.glassTint = intensity;
    window.localStorage.setItem(STORAGE_KEY, intensity);
  }, [intensity]);

  return (
    <GlassTintContext.Provider value={{ intensity, setIntensity }}>
      {children}
    </GlassTintContext.Provider>
  );
}

export function useGlassTint() {
  const ctx = useContext(GlassTintContext);
  if (!ctx) throw new Error("useGlassTint must be used within GlassTintProvider");
  return ctx;
}
