import { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Float, Stars, Html, Trail } from '@react-three/drei';
import * as THREE from 'three';

// Detect mobile once at module load to scale particle counts and effects
const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

/* ----------------------------------------------------------------------------
 * Procedural "Earth-like" surface — generated entirely on the GPU via shaders
 * so we don't need to ship any texture files. Uses layered simplex-style noise
 * for continents + oceans + clouds, plus a soft city-light glow on the dark
 * side. Looks dramatically more modern than wireframe + distort material.
 * -------------------------------------------------------------------------- */

const earthVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Cheap value-noise based continents — no textures required
const earthFragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uOcean;
  uniform vec3 uLand;
  uniform vec3 uIce;
  uniform vec3 uGlow;

  // Hash + value noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = normalize(vPosition);

    // Continents: thresholded fbm
    float continents = fbm(p * 2.2);
    float landMask = smoothstep(0.48, 0.55, continents);

    // Vegetation / desert variation
    float detail = fbm(p * 6.0 + 1.7);
    vec3 land = mix(uLand * 0.7, uLand, detail);

    // Polar ice caps
    float lat = abs(p.y);
    float ice = smoothstep(0.78, 0.92, lat);

    vec3 surface = mix(uOcean, land, landMask);
    surface = mix(surface, uIce, ice);

    // Day/night terminator — fake sun from upper-right
    vec3 sunDir = normalize(vec3(0.7, 0.5, 1.0));
    float diff = clamp(dot(vNormal, sunDir), 0.0, 1.0);
    float ambient = 0.18;
    vec3 lit = surface * (ambient + diff * 1.1);

    // City lights on the dark side over land
    float dark = 1.0 - clamp(diff * 4.0, 0.0, 1.0);
    float cities = smoothstep(0.55, 0.7, fbm(p * 18.0)) * landMask * dark;
    lit += uGlow * cities * 1.4;

    // Soft cloud layer (animated)
    float clouds = smoothstep(0.55, 0.75, fbm(p * 3.0 + vec3(uTime * 0.02, 0.0, 0.0)));
    lit += vec3(clouds) * 0.18 * (0.4 + diff);

    // Fresnel atmosphere rim
    float rim = pow(1.0 - max(dot(vNormal, vec3(0,0,1)), 0.0), 2.5);
    lit += uGlow * rim * 0.45;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

// Atmosphere halo — additive, back-side only
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`;

const ModernEarth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const segments = isMobile ? 64 : 128;

  const earthUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOcean: { value: new THREE.Color('#0a2a4a') },
    uLand: { value: new THREE.Color('#1a8a5a') },
    uIce: { value: new THREE.Color('#e8f6ff') },
    uGlow: { value: new THREE.Color('#00ffff') },
  }), []);

  const atmosphereUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#00d4ff') },
  }), []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = state.clock.getElapsedTime() * 0.06;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.getElapsedTime() * 0.09;
    }
    earthUniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <group>
      {/* Earth surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, segments, segments]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* Inner atmosphere glow */}
      <mesh scale={1.04}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere halo */}
      <mesh scale={1.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

/* ----------------------------------------------------------------------------
 * Orbital ring with a satellite that traces a glowing trail.
 * -------------------------------------------------------------------------- */

const OrbitingSatellite = ({
  radius,
  speed,
  inclination,
  color,
}: {
  radius: number;
  speed: number;
  inclination: number;
  color: string;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const satRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (satRef.current) {
      satRef.current.position.x = Math.cos(t) * radius;
      satRef.current.position.z = Math.sin(t) * radius;
      satRef.current.position.y = Math.sin(t) * 0.05;
    }
  });

  return (
    <group ref={groupRef} rotation={[inclination, 0, 0]}>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.003, 8, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      {/* Satellite with glowing trail */}
      <Trail width={0.6} length={6} color={new THREE.Color(color)} attenuation={(t) => t * t}>
        <mesh ref={satRef}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Trail>
    </group>
  );
};

/* ----------------------------------------------------------------------------
 * Data points scattered across the globe surface — pulsing markers that look
 * like live monitoring stations.
 * -------------------------------------------------------------------------- */

const DataMarkers = () => {
  const ref = useRef<THREE.Points>(null);

  const COUNT = isMobile ? 60 : 140;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.012;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [COUNT]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.06;
      const mat = ref.current.material as THREE.PointsMaterial;
      mat.size = 0.025 + Math.sin(clock.getElapsedTime() * 3) * 0.008;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00ffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const Scene = () => (
  <Float speed={0.8} rotationIntensity={0.08} floatIntensity={0.15}>
    <group>
      <ModernEarth />
      <DataMarkers />
      <OrbitingSatellite radius={1.4} speed={0.45} inclination={0.4} color="#00ffff" />
      <OrbitingSatellite radius={1.55} speed={-0.3} inclination={-0.6} color="#aa00ff" />
      <OrbitingSatellite radius={1.7} speed={0.25} inclination={0.15} color="#00ff99" />
    </group>
  </Float>
);

const LoadingFallback = () => (
  <Html center>
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-primary text-sm mt-2">Initializing Earth…</p>
    </div>
  </Html>
);

export const Globe3D = ({ className = '' }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Pause render loop when tab/page is hidden — saves battery on Android
  useEffect(() => {
    const onVis = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Force a layout/resize tick once mounted so r3f computes the correct viewport
  // even when wrapped in transformed/animated parents. Fixes the "blank until
  // first scroll/touch" issue on some browsers.
  useEffect(() => {
    const tick = () => window.dispatchEvent(new Event('resize'));
    const r1 = requestAnimationFrame(tick);
    const t1 = setTimeout(tick, 100);
    const t2 = setTimeout(tick, 400);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Soft ambient glow that blends the globe into the page's space gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsla(180,100%,50%,0.18) 0%, hsla(270,70%,40%,0.10) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
        dpr={isMobile ? 1 : [1, 1.75]}
        performance={{ min: 0.4 }}
        frameloop={isVisible ? 'always' : 'demand'}
        onCreated={({ invalidate }) => {
          // Trigger an immediate render so the globe shows up without waiting
          // for the first scroll/touch event. Do NOT call gl.render() directly
          // here — r3f manages the scene/camera, and calling render() with the
          // wrong arguments throws and breaks the canvas.
          invalidate();
          window.dispatchEvent(new Event('resize'));
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* No solid background — let the page's space gradient show through */}
          <Stars
            radius={80}
            depth={40}
            count={isMobile ? 400 : 1200}
            factor={3}
            saturation={0}
            fade
            speed={0.3}
          />
          <ambientLight intensity={0.35} />
          <pointLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} color="#aa00ff" intensity={0.5} />
          <Scene />
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
