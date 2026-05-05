"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { Star } from "@/types";

export default function StarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [star, setStar] = useState<Star | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/stars/${id}`).then((res) => setStar(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-space-950 flex items-center justify-center"><div className="text-4xl animate-spin-slow">✨</div></div>;
  if (!star) return <div className="min-h-screen bg-space-950 flex items-center justify-center text-white/50">Star not found</div>;

  const rows = [
    ["Type", star.star_type],
    ["Spectral Class", star.spectral_class],
    ["Magnitude", star.magnitude],
    ["Absolute Magnitude", star.absolute_magnitude],
    ["Constellation", star.constellation],
    ["Distance", star.distance_light_years ? `${Number(star.distance_light_years).toLocaleString()} light-years` : null],
    ["Temperature", star.temperature_kelvin ? `${Number(star.temperature_kelvin).toLocaleString()} K` : null],
    ["Luminosity", star.luminosity ? `${star.luminosity} L☉` : null],
    ["Mass", star.mass_solar ? `${star.mass_solar} M☉` : null],
    ["Radius", star.radius_solar ? `${star.radius_solar} R☉` : null],
    ["Right Ascension", `${Number(star.ra).toFixed(6)}°`],
    ["Declination", `${Number(star.dec).toFixed(6)}°`],
    ["HIP ID", star.hip_id],
    ["HD ID", star.hd_id],
    ["Catalog ID", star.catalog_id],
    ["Registry Status", star.registry_status],
  ].filter(([, v]) => v !== null && v !== undefined);

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <Link href="/ar" className="text-white/50 text-sm">← Sky View</Link>
        <h1 className="font-bold truncate">{star.common_name || star.scientific_name || star.catalog_id}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="glass-panel p-6 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h2 className="text-2xl font-bold">{star.custom_name || star.common_name || star.scientific_name}</h2>
          {star.custom_name && star.common_name && (
            <p className="text-star-blue text-sm mt-1">({star.common_name})</p>
          )}
          <p className="text-white/40 text-sm mt-1">{star.constellation}</p>
          {star.is_named && (
            <span className="inline-block mt-3 text-xs bg-star-gold/20 text-star-gold border border-star-gold/30 px-3 py-1 rounded-full">
              Named Star
            </span>
          )}
        </div>

        {/* Details */}
        <div className="glass-panel p-5 space-y-2">
          {rows.map(([label, value]) => (
            <div key={String(label)} className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-white/40">{label}</span>
              <span className="text-white/80 text-right ml-4">{String(value)}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {star.is_available_for_naming && (
            <Link
              href={isAuthenticated ? `/name-star/${star.id}` : `/login?redirect=/name-star/${star.id}`}
              className="flex-1 btn-primary py-3 text-center text-sm"
            >
              Name this Star
            </Link>
          )}
          <Link href="/ar" className="flex-1 btn-secondary py-3 text-center text-sm">
            View in AR
          </Link>
        </div>

        <p className="text-white/20 text-xs text-center leading-relaxed">
          Custom star names are ceremonial. They do not replace IAU-recognized official names.
        </p>
      </div>
    </div>
  );
}
