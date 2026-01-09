import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Grid = () => {
  const meshRef = useRef<THREE.Points>(null);
  
  const { positions, originalPositions } = useMemo(() => {
    const size = 20;
    const segments = 40;
    const positions = new Float32Array(segments * segments * 3);
    const originalPositions = new Float32Array(segments * segments * 3);
    
    let i = 0;
    for (let x = 0; x < segments; x++) {
      for (let z = 0; z < segments; z++) {
        const xPos = (x / segments - 0.5) * size;
        const zPos = (z / segments - 0.5) * size;
        
        positions[i] = xPos;
        positions[i + 1] = 0;
        positions[i + 2] = zPos;
        
        originalPositions[i] = xPos;
        originalPositions[i + 1] = 0;
        originalPositions[i + 2] = zPos;
        
        i += 3;
      }
    }
    
    return { positions, originalPositions };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positionAttr = meshRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positionAttr.count; i++) {
      const x = originalPositions[i * 3];
      const z = originalPositions[i * 3 + 2];
      
      const wave1 = Math.sin(x * 0.3 + time) * 0.5;
      const wave2 = Math.cos(z * 0.3 + time * 0.8) * 0.5;
      const wave3 = Math.sin((x + z) * 0.2 + time * 1.2) * 0.3;
      
      positionAttr.array[i * 3 + 1] = wave1 + wave2 + wave3;
    }
    
    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} rotation={[-Math.PI / 4, 0, 0]} position={[0, -2, -5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00ffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface WaveGridProps {
  className?: string;
}

export const WaveGrid = ({ className = "" }: WaveGridProps) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.1} />
        <Grid />
      </Canvas>
    </div>
  );
};

export default WaveGrid;
