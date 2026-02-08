import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

const GlobePoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Reduced particle count from 6000 to 2000 for better performance
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 1.05 + Math.random() * 0.05;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#00ffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const DataRings = () => {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (ringRef1.current) {
      ringRef1.current.rotation.x = Math.PI / 2;
      ringRef1.current.rotation.z = time * 0.2;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x = Math.PI / 3;
      ringRef2.current.rotation.y = time * 0.15;
    }
    if (ringRef3.current) {
      ringRef3.current.rotation.x = Math.PI / 4;
      ringRef3.current.rotation.z = -time * 0.1;
    }
  });

  return (
    <>
      <mesh ref={ringRef1}>
        <torusGeometry args={[1.3, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ringRef2}>
        <torusGeometry args={[1.4, 0.008, 16, 100]} />
        <meshBasicMaterial color="#aa00ff" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ringRef3}>
        <torusGeometry args={[1.5, 0.005, 16, 100]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
      </mesh>
    </>
  );
};

const AnimatedGlobe = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.12;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.05;
    }
    
    if (glowRef.current) {
      glowRef.current.rotation.y = -state.clock.getElapsedTime() * 0.08;
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.03 + 1;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.2}
      floatIntensity={0.3}
    >
      <group>
        {/* Main globe - reduced segments from 96 to 48 for performance */}
        <Sphere ref={meshRef} args={[1, 48, 48]}>
          <MeshDistortMaterial
            color="#0a4d4d"
            attach="material"
            distort={0.08}
            speed={0.8}
            roughness={0.3}
            metalness={0.9}
            emissive="#00ffff"
            emissiveIntensity={0.25}
          />
        </Sphere>
        
        {/* Inner glow */}
        <Sphere args={[1.03, 48, 48]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </Sphere>
        
        {/* Outer glow ring */}
        <Sphere ref={glowRef} args={[1.15, 32, 32]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Data rings */}
        <DataRings />
        
        {/* Data points */}
        <GlobePoints />
      </group>
    </Float>
  );
};

const LoadingFallback = () => (
  <Html center>
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-primary text-sm mt-2">Loading Globe...</p>
    </div>
  </Html>
);

export const Globe3D = ({ className = "" }: { className?: string }) => {
  return (
    <div 
      className={`w-full h-full ${className}`} 
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      <Canvas 
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        gl={{ 
          antialias: false, 
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        dpr={1}
        performance={{ min: 0.3 }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Stars 
            radius={80} 
            depth={40} 
            count={1000}
            factor={3} 
            saturation={0} 
            fade 
            speed={0.3}
          />
          <ambientLight intensity={0.25} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
          <pointLight position={[-10, -10, -10]} color="#aa00ff" intensity={0.6} />
          <spotLight 
            position={[0, 5, 0]} 
            intensity={0.4} 
            angle={0.3} 
            penumbra={1}
            color="#00ffff"
          />
          <AnimatedGlobe />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.4}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI - Math.PI / 4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Globe3D;
