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

export function SkyLabels({ objects, selectedObjectId, sphereRadius = 500 }: Props) {
  const labels = objects
    .filter((object) => object.x !== undefined)
    .filter(
      (object) =>
        object.id === selectedObjectId ||
        object.custom_name ||
        object.common_name ||
        ((object.magnitude ?? 99) <= 2.2 && object.object_kind !== "galaxy")
    )
    .sort((a, b) => {
      if (a.id === selectedObjectId) return -1;
      if (b.id === selectedObjectId) return 1;
      return (a.magnitude ?? 99) - (b.magnitude ?? 99);
    })
    .slice(0, 90);

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
            distanceFactor={selected ? 205 : 185}
            zIndexRange={selected ? [80, 0] : [20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className={`sky-object-label ${selected ? "sky-object-label-selected" : ""}`}>
              <span className="sky-object-label-name">{displayName(object)}</span>
            </div>
          </Html>
        );
      })}
    </>
  );
}
