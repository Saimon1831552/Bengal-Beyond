"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";

export default function Hero3D() {
  return (
    <div className="h-[360px] w-full">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 3, 3]} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
          <mesh>
            <torusKnotGeometry args={[1, 0.35, 128, 32]} />
            <meshStandardMaterial color="#126b5c" metalness={0.4} roughness={0.3} />
          </mesh>
        </Float>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
}
