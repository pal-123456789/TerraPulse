import { useRef, useMemo, memo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Stars, Trail, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Floating particles around the globe
const FloatingParticles = memo(() => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 2 + Math.random() * 3;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      sizes[i] = Math.random() * 0.03 + 0.01;
    }
    
    return { positions, sizes };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
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
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// Energy rings
const EnergyRings = memo(() => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={ringsRef}>
      {[1.5, 1.8, 2.1].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 6]}>
          <torusGeometry args={[radius, 0.005, 8, 128]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.3 - i * 0.05}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
});

EnergyRings.displayName = 'EnergyRings';

// Main planet
const Planet = memo(() => {
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (planetRef.current) {
      planetRef.current.rotation.y = time * 0.1;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = -time * 0.05;
      const pulse = Math.sin(time * 2) * 0.02 + 1;
      atmosphereRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group>
        {/* Core planet */}
        <Sphere ref={planetRef} args={[1, 128, 128]}>
          <MeshDistortMaterial
            color="#0a1628"
            emissive="#00ffff"
            emissiveIntensity={0.1}
            distort={0.15}
            speed={2}
            roughness={0.4}
            metalness={0.8}
          />
        </Sphere>
        
        {/* Grid overlay */}
        <Sphere args={[1.01, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            wireframe
            transparent
            opacity={0.15}
          />
        </Sphere>
        
        {/* Atmosphere */}
        <Sphere ref={atmosphereRef} args={[1.1, 64, 64]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Outer glow */}
        <Sphere args={[1.3, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      </group>
    </Float>
  );
});

Planet.displayName = 'Planet';

// Orbiting satellite
const OrbitingSatellite = memo(({ speed = 1, radius = 2, offset = 0 }: { speed?: number; radius?: number; offset?: number }) => {
  const satelliteRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * speed + offset;
    if (satelliteRef.current) {
      satelliteRef.current.position.x = Math.cos(time) * radius;
      satelliteRef.current.position.z = Math.sin(time) * radius;
      satelliteRef.current.position.y = Math.sin(time * 2) * 0.3;
    }
  });

  return (
    <group ref={satelliteRef}>
      <mesh>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      {/* Satellite glow */}
      <pointLight intensity={0.3} distance={1} color="#00ffff" />
    </group>
  );
});

OrbitingSatellite.displayName = 'OrbitingSatellite';

// Scene component
const Scene = memo(() => {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#aa00ff" />
      
      <Stars radius={50} depth={50} count={2000} factor={3} saturation={0} fade speed={1} />
      
      <Planet />
      <EnergyRings />
      <FloatingParticles />
      
      {/* Orbiting satellites */}
      <OrbitingSatellite speed={0.5} radius={1.8} offset={0} />
      <OrbitingSatellite speed={0.4} radius={2.2} offset={Math.PI / 2} />
      <OrbitingSatellite speed={0.6} radius={2.5} offset={Math.PI} />
    </>
  );
});

Scene.displayName = 'Scene';

interface HeroSceneProps {
  className?: string;
}

const HeroScene = memo(({ className = "" }: HeroSceneProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
});

HeroScene.displayName = 'HeroScene';

export { HeroScene };
export default HeroScene;
