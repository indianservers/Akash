"use client";
import { Html } from "@react-three/drei";
import type { StarWithPosition } from "@/types";

interface Props {
  objects: StarWithPosition[];
  selectedObjectId?: number | null;
  sphereRadius?: number;
}

function displayName(object: StarWithPosition): string {
  return object.custom_name || object.common_name || object.bayer_designation || object.scientific_name || object.catalog_id || `Object ${object.id}`;
}

function badge(object: StarWithPosition): string {
  if (object.object_kind === "galaxy") return "Deep sky";
  if (object.custom_name) return "Named";
  if ((object.magnitude ?? 99) <= 2.5) return "Bright";
  return "Star";
}

export function SkyLabels({ objects, selectedObjectId, sphereRadius = 500 }: Props) {
  const labels = objects
    .filter((object) => object.x !== undefined)
    .filter(
      (object) =>
        object.id === selectedObjectId ||
        object.object_kind === "galaxy" ||
        object.custom_name ||
        object.common_name ||
        (object.magnitude ?? 99) <= 3.2
    )
    .sort((a, b) => {
      if (a.id === selectedObjectId) return -1;
      if (b.id === selectedObjectId) return 1;
      return (a.magnitude ?? 99) - (b.magnitude ?? 99);
    })
    .slice(0, 42);

  return (
    <>
      {labels.map((object) => {
        const selected = object.id === selectedObjectId;
        return (
          <Html
            key={object.id}
            position={[
              (object.x ?? 0) * sphereRadius,
              (object.y ?? 0) * sphereRadius,
              (object.z ?? 0) * sphereRadius,
            ]}
            center
            distanceFactor={selected ? 56 : 78}
            zIndexRange={selected ? [80, 0] : [20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className={`sky-object-label ${selected ? "sky-object-label-selected" : ""}`}
            >
              <span className="sky-object-label-name">{displayName(object)}</span>
              <span className="sky-object-label-meta">
                {badge(object)} · Mag {object.magnitude?.toFixed(1) ?? "n/a"}
              </span>
            </div>
          </Html>
        );
      })}
    </>
  );
}
