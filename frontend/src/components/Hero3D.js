"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, AdaptiveDpr } from "@react-three/drei";

export default function Hero3D({ active = true }) {
  return (
    <div className="h-[360px] w-full">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4] }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 3, 3]} />
        <Float speed={active ? 2 : 0} rotationIntensity={1} floatIntensity={1.5}>
          <mesh>
            <torusKnotGeometry args={[1, 0.35, 96, 24]} />
            <meshStandardMaterial color="#126b5c" metalness={0.4} roughness={0.3} />
          </mesh>
        </Float>
        <OrbitControls enableZoom={false} autoRotate={active} autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
}