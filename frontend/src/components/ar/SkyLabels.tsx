"use client";
import { Billboard, Text } from "@react-three/drei";
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
        const position: [number, number, number] = [
          (object.x ?? 0) * sphereRadius,
          (object.y ?? 0) * sphereRadius,
          (object.z ?? 0) * sphereRadius,
        ];
        return (
          <Billboard
            key={object.id}
            position={position}
            follow
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <Text
              position={[selected ? 9 : 7, selected ? 5 : 4, 0]}
              anchorX="left"
              anchorY="middle"
              color={selected ? "#ffd76a" : "#f4f7ff"}
              fontSize={selected ? 13 : 10}
              maxWidth={selected ? 130 : 105}
              outlineWidth={selected ? 0.62 : 0.48}
              outlineColor="#020308"
              outlineOpacity={0.96}
              renderOrder={selected ? 12 : 8}
            >
              {displayName(object)}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}
