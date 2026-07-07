import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const EnergyCore = memo(() => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 0.8 + Math.random() * 0.4;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Cyan to purple gradient
      const t = Math.random();
      colors[i * 3] = 0 + t * 0.5;
      colors[i * 3 + 1] = 1 - t * 0.5;
      colors[i * 3 + 2] = 1;
    }
    
    return { positions, colors };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.3;
      coreRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
    }
    
    if (ringsRef.current) {
      ringsRef.current.rotation.x = time * 0.2;
      ringsRef.current.rotation.y = time * 0.3;
    }
    
    if (particlesRef.current) {
      particlesRef.current.rotation.y = -time * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        {/* Energy core */}
        <Sphere ref={coreRef} args={[0.3, 64, 64]}>
          <MeshDistortMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.8}
            distort={0.3}
            speed={4}
            roughness={0}
            metalness={1}
          />
        </Sphere>
        
        {/* Inner glow */}
        <Sphere args={[0.35, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.4}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Outer glow */}
        <Sphere args={[0.5, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Energy rings */}
        <group ref={ringsRef}>
          {[0.5, 0.6, 0.7].map((radius, i) => (
            <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, 0, i * 0.5]}>
              <torusGeometry args={[radius, 0.01, 8, 64]} />
              <meshBasicMaterial
                color="#00ffff"
                transparent
                opacity={0.5 - i * 0.1}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
        
        {/* Orbiting particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.positions.length / 3}
              array={particles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particles.colors.length / 3}
              array={particles.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.015}
            vertexColors
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      </group>
    </Float>
  );
});

EnergyCore.displayName = 'EnergyCore';

interface EnergyOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EnergyOrb = memo(({ className = "", size = 'md' }: EnergyOrbProps) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-64 h-64'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Canvas camera={{ position: [0, 0, 2], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#00ffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#aa00ff" />
        <EnergyCore />
      </Canvas>
    </div>
  );
});

EnergyOrb.displayName = 'EnergyOrb';

export { EnergyOrb };
export default EnergyOrb;
