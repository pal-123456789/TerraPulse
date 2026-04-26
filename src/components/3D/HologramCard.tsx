import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const HologramMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.05;
    }
    
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = -time * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Main hologram body */}
        <RoundedBox ref={meshRef} args={[2, 1.2, 0.1]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color="#00ffff"
            transparent
            opacity={0.15}
            metalness={0.9}
            roughness={0.1}
            emissive="#00ffff"
            emissiveIntensity={0.2}
          />
        </RoundedBox>
        
        {/* Wireframe overlay */}
        <lineSegments ref={wireframeRef}>
          <edgesGeometry args={[new THREE.BoxGeometry(2.1, 1.3, 0.12)]} />
          <lineBasicMaterial color="#00ffff" transparent opacity={0.5} />
        </lineSegments>
        
        {/* Corner accents */}
        {[[-1, 0.6], [1, 0.6], [-1, -0.6], [1, -0.6]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.06]}>
            <boxGeometry args={[0.1, 0.1, 0.02]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    </Float>
  );
};

interface HologramCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const HologramCard = ({ className = "", children }: HologramCardProps) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[3, 3, 3]} intensity={0.5} color="#00ffff" />
          <HologramMesh />
        </Canvas>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default HologramCard;
