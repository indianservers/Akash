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

function labelColor(object: StarWithPosition, selected: boolean): string {
  if (selected) return "#ffd76a";
  const mag = object.magnitude ?? 8;
  if (object.custom_name) return "#ffdca8";
  if (mag <= 0.8) return "#fff3d2";
  if (mag <= 2.4) return "#d9e4ff";
  return "#aeb8df";
}

function labelSize(object: StarWithPosition, selected: boolean): number {
  if (selected) return 8.5;
  const mag = object.magnitude ?? 8;
  if (object.custom_name || object.common_name) return mag <= 1 ? 7.2 : 6.2;
  if (mag <= 1) return 6.8;
  if (mag <= 2.2) return 5.4;
  return 4.3;
}

export function SkyLabels({ objects, selectedObjectId, sphereRadius = 500 }: Props) {
  const labels = objects
    .filter((object) => object.x !== undefined)
    .filter(
      (object) =>
        object.id === selectedObjectId ||
        object.custom_name ||
        object.common_name ||
        object.bayer_designation ||
        ((object.magnitude ?? 99) <= 4.2 && object.object_kind !== "galaxy")
    )
    .sort((a, b) => {
      if (a.id === selectedObjectId) return -1;
      if (b.id === selectedObjectId) return 1;
      return (a.magnitude ?? 99) - (b.magnitude ?? 99);
    })
    .slice(0, 160);

  return (
    <>
      {labels.map((object) => {
        const selected = object.id === selectedObjectId;
        const position: [number, number, number] = [
          (object.x ?? 0) * sphereRadius,
          (object.y ?? 0) * sphereRadius,
          (object.z ?? 0) * sphereRadius,
        ];
        const fontSize = labelSize(object, selected);
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
              position={[fontSize * 0.72, fontSize * 0.28, 0]}
              anchorX="left"
              anchorY="middle"
              color={labelColor(object, selected)}
              fontSize={fontSize}
              maxWidth={selected ? 110 : 92}
              outlineWidth={selected ? 0.28 : 0.16}
              outlineColor="#020816"
              outlineOpacity={0.86}
              fillOpacity={selected ? 1 : 0.82}
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
