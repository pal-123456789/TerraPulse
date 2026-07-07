import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface OrbProps {
  position: [number, number, number];
  color: string;
  scale?: number;
  speed?: number;
}

const Orb = ({ position, color, scale = 1, speed = 1 }: OrbProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * speed;
    
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(time) * 0.3;
      meshRef.current.rotation.y = time * 0.5;
    }
    
    if (glowRef.current) {
      const pulse = Math.sin(time * 2) * 0.1 + 1;
      glowRef.current.scale.setScalar(pulse * scale * 1.2);
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        <Sphere ref={meshRef} args={[0.3 * scale, 32, 32]}>
          <MeshDistortMaterial
            color={color}
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </Sphere>
        
        <Sphere ref={glowRef} args={[0.35 * scale, 16, 16]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      </group>
    </Float>
  );
};

const FloatingOrbsScene = () => {
  const orbs = useMemo(() => [
    { position: [-2, 1, -1] as [number, number, number], color: '#00ffff', scale: 1.2, speed: 0.8 },
    { position: [2.5, -0.5, -2] as [number, number, number], color: '#aa00ff', scale: 0.8, speed: 1.2 },
    { position: [-1.5, -1, -1.5] as [number, number, number], color: '#00ff88', scale: 0.6, speed: 1 },
    { position: [1, 1.5, -2.5] as [number, number, number], color: '#ff6b9d', scale: 0.7, speed: 0.9 },
    { position: [0, -1.5, -1] as [number, number, number], color: '#ffd700', scale: 0.5, speed: 1.1 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color="#aa00ff" />
      
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}
    </>
  );
};

interface FloatingOrbsProps {
  className?: string;
}

export const FloatingOrbs = ({ className = "" }: FloatingOrbsProps) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <FloatingOrbsScene />
      </Canvas>
    </div>
  );
};

export default FloatingOrbs;
