"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { StarWithPosition } from "@/types";
import { formatDate, daysUntilExpiry } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

interface Props {
  star: StarWithPosition;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between text-sm py-1 border-b border-white/5">
      <span className="text-white/50">{label}</span>
      <span className="text-star-white text-right ml-4 max-w-[60%]">{String(value)}</span>
    </div>
  );
}

function bestWindow(star: StarWithPosition): string {
  const altitude = star.altitude ?? -90;
  if (altitude > 45) return "Best now";
  if (altitude > 15) return "Good this hour";
  if (altitude > -18) return "Rises later tonight";
  return "Below horizon tonight";
}

function lightPollution(star: StarWithPosition): string {
  const mag = star.magnitude ?? 99;
  if (star.object_kind === "galaxy" || mag > 6.5) return "Dark rural sky recommended";
  if (mag <= 2.5) return "Usually visible in cities";
  if (mag <= 4.5) return "Visible in suburbs";
  return "Rural sky recommended";
}

function comparisonFacts(star: StarWithPosition): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [];
  if (star.distance_light_years) {
    if (star.object_kind === "galaxy") {
      facts.push({
        label: "Light travel",
        value: `${star.distance_light_years >= 1_000_000 ? (star.distance_light_years / 1_000_000).toFixed(1) + "M" : Math.round(star.distance_light_years).toLocaleString()} years`,
      });
    } else {
      facts.push({ label: "Light travel", value: `${Math.round(star.distance_light_years).toLocaleString()} years` });
    }
  }
  if (star.magnitude !== undefined) {
    facts.push({
      label: "Viewing aid",
      value: star.object_kind === "galaxy" || star.magnitude > 6.5
        ? "Telescope"
        : star.magnitude > 4.5
          ? "Binoculars"
          : "Naked eye",
    });
  }
  if (star.altitude !== undefined) {
    facts.push({ label: "Sky height", value: `${Math.round(star.altitude)}°` });
  }
  return facts;
}

export function StarDetailPanel({ star, onClose }: Props) {
  const { isAuthenticated } = useAuthStore();
  const days = daysUntilExpiry(star.expiry_date);
  const baseName = star.custom_name || star.common_name || star.scientific_name || `Star ${star.catalog_id}`;
  const displayName = star.galaxy_name && star.scientific_name && !star.custom_name && !star.common_name && star.object_kind !== "galaxy"
    ? `${star.galaxy_name} - ${star.scientific_name}`
    : baseName;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-30 bg-space-900/95 backdrop-blur-xl rounded-t-3xl border border-white/10 max-h-[80vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <h2 className="text-xl font-bold text-star-white">{displayName}</h2>
              </div>
              {star.custom_name && star.common_name && (
                <p className="text-sm text-star-blue mt-1">({star.common_name})</p>
              )}
              {star.constellation && (
                <p className="text-xs text-white/40 mt-0.5">{star.constellation}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Named star badge */}
          {star.is_named && star.dedication_type && (
            <div className="bg-star-gold/10 border border-star-gold/30 rounded-xl p-3 mb-4">
              <p className="text-star-gold text-xs font-medium">{star.dedication_type}</p>
              {star.dedication_message && (
                <p className="text-white/80 text-sm mt-1">{star.dedication_message}</p>
              )}
              {star.recipient_name && (
                <p className="text-white/60 text-xs mt-1">For: {star.recipient_name}</p>
              )}
              {star.expiry_date && (
                <p className="text-white/40 text-xs mt-1">
                  Valid until: {formatDate(star.expiry_date)}
                  {days !== null && days > 0 && ` (${days} days remaining)`}
                </p>
              )}
              {!star.expiry_date && star.is_named && (
                <p className="text-white/40 text-xs mt-1">Lifetime registration</p>
              )}
            </div>
          )}

          {/* Star details */}
          {star.thumbnail_url && (
            <img
              src={star.thumbnail_url}
              alt={displayName}
              className="mb-4 h-36 w-full rounded-lg border border-white/10 object-cover"
            />
          )}

          {comparisonFacts(star).length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {comparisonFacts(star).map((fact) => (
                <div key={fact.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">{fact.label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-star-white">{fact.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-0.5">
            <Row label="Object" value={star.object_kind === "galaxy" ? "Galaxy" : "Star"} />
            <Row label="Type" value={star.star_type} />
            <Row label="Galaxy" value={star.object_kind === "galaxy" ? undefined : star.galaxy_name} />
            <Row label="Spectral Class" value={star.spectral_class} />
            <Row label="Magnitude" value={star.magnitude} />
            <Row label="Distance" value={star.distance_light_years ? `${star.distance_light_years.toLocaleString()} ly` : undefined} />
            <Row label="Best Window" value={bestWindow(star)} />
            <Row label="Light Pollution" value={lightPollution(star)} />
            <Row label="Temperature" value={star.temperature_kelvin ? `${star.temperature_kelvin.toLocaleString()} K` : undefined} />
            <Row label="Luminosity" value={star.luminosity ? `${star.luminosity} L☉` : undefined} />
            <Row label="Catalog ID" value={star.catalog_id} />
            <Row label="RA" value={star.ra !== undefined ? `${Number(star.ra).toFixed(4)}°` : undefined} />
            <Row label="Dec" value={star.dec !== undefined ? `${Number(star.dec).toFixed(4)}°` : undefined} />
            {star.altitude !== undefined && (
              <Row label="Altitude" value={`${star.altitude.toFixed(1)}°`} />
            )}
            {star.azimuth !== undefined && (
              <Row label="Azimuth" value={`${star.azimuth.toFixed(1)}°`} />
            )}
            <Row label="Status" value={star.registry_status} />
          </div>

          {star.object_kind !== "galaxy" && (
            <p className="text-white/25 text-xs mt-4 leading-relaxed">
              Custom star names are ceremonial and recorded only in this private registry. They do not
              replace official names recognized by the International Astronomical Union.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-5">
            {star.object_kind !== "galaxy" && star.is_available_for_naming && (
              <Link
                href={isAuthenticated ? `/name-star/${star.id}` : `/login?redirect=/name-star/${star.id}`}
                className="flex-1 bg-star-blue text-space-950 font-semibold py-3 rounded-xl text-center text-sm"
              >
                Name this Star
              </Link>
            )}
            <Link
              href={`/stars/${star.id}`}
              className="flex-1 border border-white/20 text-star-white py-3 rounded-xl text-center text-sm"
            >
              Full Details
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
