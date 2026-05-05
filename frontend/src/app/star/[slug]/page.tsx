"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface PublicStarPage {
  star: {
    id: number;
    catalog_id?: string;
    common_name?: string;
    scientific_name?: string;
    constellation?: string;
    star_type?: string;
    spectral_class?: string;
    magnitude?: number;
    distance_light_years?: number;
    ra: number;
    dec: number;
  } | null;
  naming: {
    star_name: string;
    dedication_type: string;
    dedication_message?: string;
    recipient_name?: string;
    applicant_name: string;
    occasion?: string;
    certificate_id?: string;
    approved_at?: string;
    expiry_date?: string;
    validity_plan: string;
  };
  disclaimer: string;
}

export default function PublicStarPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicStarPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/registry/${slug}`)
      .then((res) => setData(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-space-950 flex items-center justify-center">
        <div className="text-4xl animate-spin-slow">✨</div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center text-center p-6">
        <div className="text-5xl mb-4">🌑</div>
        <h1 className="text-xl font-bold text-star-white mb-2">Star Not Found</h1>
        <p className="text-white/50 text-sm mb-6">This star page may be private or does not exist.</p>
        <Link href="/registry" className="btn-primary px-6 py-3">Browse Registry</Link>
      </div>
    );
  }

  const { star, naming } = data;

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-space-800 to-space-950 pt-safe-top">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: Math.random() * 2 + 0.5, height: Math.random() * 2 + 0.5, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.1 }} />
          ))}
        </div>
        <div className="relative px-4 py-12 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-6xl mb-4">⭐</motion.div>
          <h1 className="text-3xl font-bold mb-2">{naming.star_name}</h1>
          {star?.common_name && <p className="text-star-blue text-sm">({star.common_name})</p>}
          {star?.constellation && <p className="text-white/40 text-xs mt-1">{star.constellation}</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Dedication card */}
        <div className="glass-panel p-6 space-y-3">
          <p className="text-star-gold font-medium">{naming.dedication_type}</p>
          {naming.dedication_message && (
            <p className="text-white/80 leading-relaxed">{naming.dedication_message}</p>
          )}
          {naming.recipient_name && (
            <p className="text-white/60 text-sm">For: <span className="text-white">{naming.recipient_name}</span></p>
          )}
          <p className="text-white/40 text-sm">Registered by: {naming.applicant_name}</p>
          {naming.occasion && <p className="text-white/40 text-sm">Occasion: {naming.occasion}</p>}
        </div>

        {/* Star details */}
        {star && (
          <div className="glass-panel p-5 space-y-2">
            <h2 className="font-semibold mb-3">Star Details</h2>
            {[
              ["Type", star.star_type],
              ["Spectral Class", star.spectral_class],
              ["Magnitude", star.magnitude],
              ["Distance", star.distance_light_years ? `${star.distance_light_years.toLocaleString()} light-years` : undefined],
              ["Catalog ID", star.catalog_id],
              ["Right Ascension", `${Number(star.ra).toFixed(4)}°`],
              ["Declination", `${Number(star.dec).toFixed(4)}°`],
            ].filter(([, v]) => v !== undefined && v !== null).map(([label, value]) => (
              <div key={String(label)} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">{label}</span>
                <span className="text-white/80">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Registration details */}
        <div className="glass-panel p-5 space-y-2">
          <h2 className="font-semibold mb-3">Registration</h2>
          {naming.certificate_id && (
            <div className="flex justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-white/40">Certificate ID</span>
              <span className="text-white/80 font-mono text-xs">{naming.certificate_id}</span>
            </div>
          )}
          {[
            ["Registered On", formatDate(naming.approved_at)],
            ["Valid Until", naming.expiry_date ? formatDate(naming.expiry_date) : "Lifetime"],
            ["Validity Plan", naming.validity_plan === "lifetime" ? "Lifetime" : naming.validity_plan === "5years" ? "5 Years" : "1 Year"],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-white/40">{label}</span>
              <span className="text-white/80">{value}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-white/25 text-xs text-center leading-relaxed px-2">{data.disclaimer}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/ar" className="flex-1 btn-primary py-3 text-center text-sm">
            View in AR Sky
          </Link>
          <Link href="/registry" className="flex-1 btn-secondary py-3 text-center text-sm">
            Browse Registry
          </Link>
        </div>
      </div>
    </div>
  );
}
