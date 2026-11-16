"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import {
  categoryColors,
  technologyModules,
} from "@/data/modules";

const goldenAngle = Math.PI * (3 - Math.sqrt(5));

function modulePosition(index: number) {
  const y = 1 - (index / (technologyModules.length - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = goldenAngle * index;
  const distance = 1.95;

  return [
    Math.cos(angle) * radius * distance,
    y * distance,
    Math.sin(angle) * radius * distance,
  ] as [number, number, number];
}

function UniverseScene() {
  const group = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const connections = useMemo(
    () =>
      technologyModules.map((module, index) => ({
        start: modulePosition(index),
        end: modulePosition((index + 5) % technologyModules.length),
        color: categoryColors[module.category],
      })),
    [],
  );

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.045;
    if (core.current) {
      core.current.rotation.y += delta * 0.12;
      core.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.17) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {connections.map((connection, index) => (
        <Line
          key={`link-${index}`}
          points={[connection.start, connection.end]}
          color={connection.color}
          lineWidth={0.65}
          transparent
          opacity={0.23}
        />
      ))}

      <mesh ref={core}>
        <icosahedronGeometry args={[0.59, 2]} />
        <meshBasicMaterial
          color="#567bff"
          wireframe
          transparent
          opacity={0.73}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshBasicMaterial color="#111938" transparent opacity={0.9} />
      </mesh>

      {[1.03, 1.39, 1.7].map((radius, index) => (
        <mesh key={radius} rotation={[0.5 + index * 0.47, 0.25, index * 0.4]}>
          <torusGeometry args={[radius, 0.004, 5, 144]} />
          <meshBasicMaterial
            color={index === 1 ? "#be9cff" : "#62e4f2"}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}

      {technologyModules.map((module, index) => (
        <mesh key={module.id} position={modulePosition(index)}>
          <sphereGeometry args={[index % 5 === 0 ? 0.045 : 0.031, 12, 12]} />
          <meshBasicMaterial
            color={categoryColors[module.category]}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function TechnologyUniverse() {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 5.8], fov: 36 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      fallback={<div className="universe-fallback" aria-hidden="true" />}
      onCreated={({ gl }) => gl.setClearColor("#080b14", 0)}
    >
      <UniverseScene />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
        rotateSpeed={0.36}
        autoRotate
        autoRotateSpeed={0.33}
      />
    </Canvas>
  );
}
