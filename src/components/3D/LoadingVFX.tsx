import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const LoadingOrb = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 1.2 + Math.random() * 0.5;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }
    
    if (glowRef.current) {
      const pulse = Math.sin(time * 3) * 0.1 + 1;
      glowRef.current.scale.setScalar(pulse);
    }
    
    if (particlesRef.current) {
      particlesRef.current.rotation.y = -time * 0.2;
      particlesRef.current.rotation.x = time * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group>
        {/* Core orb */}
        <Sphere ref={meshRef} args={[0.5, 64, 64]}>
          <MeshDistortMaterial
            color="#00ffff"
            attach="material"
            distort={0.4}
            speed={3}
            roughness={0.2}
            metalness={0.9}
            emissive="#00ffff"
            emissiveIntensity={0.5}
          />
        </Sphere>
        
        {/* Glow layer */}
        <Sphere ref={glowRef} args={[0.55, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Outer glow */}
        <Sphere args={[0.8, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.length / 3}
              array={particles}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.02}
            color="#00ffff"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      </group>
    </Float>
  );
};

interface LoadingVFXProps {
  text?: string;
  className?: string;
}

export const LoadingVFX = ({ text = "Loading...", className = "" }: LoadingVFXProps) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="w-32 h-32 md:w-48 md:h-48">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#00ffff" />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#aa00ff" />
          <LoadingOrb />
        </Canvas>
      </div>
      <p className="text-primary text-glow animate-pulse mt-4 font-medium">{text}</p>
    </div>
  );
};

export default LoadingVFX;
