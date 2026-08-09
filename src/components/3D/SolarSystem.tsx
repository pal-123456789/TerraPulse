/**
 * Immersive 3D Solar System — procedural planet globes with orbital controls.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

const isMobile =
  typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;


type PlanetKind = "rock" | "venus" | "earth" | "mars" | "gas" | "ice";

interface PlanetDef {
  name: string;
  kind: PlanetKind;
  size: number;
  distance: number;
  speed: number;
  colors: [string, string, string, string];
  emissive?: string;
  atmosphere?: string;
  ring?: { inner: number; outer: number; color: string };
  tilt?: number;
}

interface SolarSystemProps {
  height?: string;
  className?: string;
}

const PLANETS: PlanetDef[] = [
  { name: "Mercury", kind: "rock", size: 0.28, distance: 2.8, speed: 0.56, colors: ["#3d342d", "#8b7a6c", "#c0ab98", "#1d1a18"] },
  { name: "Venus", kind: "venus", size: 0.44, distance: 3.8, speed: 0.43, colors: ["#5d3917", "#d9903d", "#f4c56e", "#fff0b8"], emissive: "#3f240a", atmosphere: "#f7c66d" },
  { name: "Earth", kind: "earth", size: 0.48, distance: 5.0, speed: 0.34, colors: ["#09244f", "#0e6db7", "#2f9d62", "#f3fbff"], emissive: "#05142d", atmosphere: "#4cc9ff", tilt: 0.41 },
  { name: "Mars", kind: "mars", size: 0.38, distance: 6.3, speed: 0.27, colors: ["#4a1f13", "#a84725", "#d9824a", "#f0c08a"], tilt: 0.44 },
  { name: "Jupiter", kind: "gas", size: 1.05, distance: 8.4, speed: 0.17, colors: ["#5d3b26", "#b7895d", "#e5c7a1", "#f6ead8"], emissive: "#241408" },
  { name: "Saturn", kind: "gas", size: 0.88, distance: 10.6, speed: 0.125, colors: ["#5a4725", "#c4a15e", "#ead7a1", "#fff1c0"], ring: { inner: 1.35, outer: 2.35, color: "#d7b66f" }, tilt: 0.47 },
  { name: "Uranus", kind: "ice", size: 0.66, distance: 12.4, speed: 0.095, colors: ["#0b4f5f", "#52c2c8", "#9ff2ef", "#dcfffb"], emissive: "#05272f", atmosphere: "#8ff6ff", tilt: 1.7 },
  { name: "Neptune", kind: "ice", size: 0.64, distance: 14.0, speed: 0.075, colors: ["#071d62", "#2349cc", "#5d7dff", "#b4c8ff"], emissive: "#061039", atmosphere: "#5d7dff" },
];

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const mix = (a: ReturnType<typeof hexToRgb>, b: ReturnType<typeof hexToRgb>, t: number) => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
});

const hash = (x: number, y: number, seed: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

const createPlanetTexture = (planet: PlanetDef) => {
  const canvas = document.createElement("canvas");
  canvas.width = isMobile ? 512 : 1024;
  canvas.height = isMobile ? 256 : 512;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(canvas.width, canvas.height);
  const palette = planet.colors.map(hexToRgb);
  const seed = planet.name.length * 19;

  for (let y = 0; y < canvas.height; y++) {
    const v = y / canvas.height;
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width;
      const n = hash(Math.floor(u * 72), Math.floor(v * 36), seed);
      const n2 = hash(Math.floor(u * 180), Math.floor(v * 90), seed + 7);
      let c = palette[1];

      if (planet.kind === "earth") {
        const land = Math.sin(u * 22 + Math.sin(v * 16) * 2) + Math.cos(v * 18 + n * 2) + n * 1.6;
        c = land > 1.05 ? mix(palette[2], palette[3], Math.max(0, lat - 0.78) * 3) : mix(palette[0], palette[1], n2 * 0.45);
      } else if (planet.kind === "gas") {
        const band = 0.5 + Math.sin(v * 58 + n * 2.5) * 0.28 + Math.sin(v * 15) * 0.14;
        c = band > 0.62 ? mix(palette[2], palette[3], n2) : mix(palette[0], palette[1], n);
        if (planet.name === "Jupiter" && u > 0.62 && u < 0.78 && v > 0.48 && v < 0.62) c = mix(hexToRgb("#8c321d"), hexToRgb("#f0b18a"), n2);
      } else if (planet.kind === "ice") {
        const streak = 0.5 + Math.sin(v * 24 + u * 10) * 0.3;
        c = mix(palette[1], streak > 0.62 ? palette[2] : palette[0], n * 0.65);
      } else if (planet.kind === "venus") {
        c = mix(palette[1], palette[2], 0.5 + Math.sin(u * 18 + v * 20 + n) * 0.35);
      } else {
        const crater = n2 > 0.88 ? 0.05 : n;
        c = mix(palette[0], palette[2], crater);
      }

      const shade = 0.86 + n2 * 0.22;
      const i = (y * canvas.width + x) * 4;
      image.data[i] = Math.min(255, c.r * shade);
      image.data[i + 1] = Math.min(255, c.g * shade);
      image.data[i + 2] = Math.min(255, c.b * shade);
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = isMobile ? 2 : 8;
  return texture;
};

const createCloudTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 12 + Math.random() * 38;
    const alpha = 0.04 + Math.random() * 0.14;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * 0.22, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
};

const Sun = () => {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) ref.current.rotation.y = t * 0.08;
    if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.06);
  });

  return (
    <group>
      <pointLight position={[0, 0, 0]} intensity={4.2} color="#ffd37a" distance={70} decay={1.2} />
      <mesh ref={ref}>
        <sphereGeometry args={[1.45, 96, 96]} />
        <meshBasicMaterial color="#ffc04d" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.75, 48, 48]} />
        <meshBasicMaterial color="#ff8c1a" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.25, 48, 48]} />
        <meshBasicMaterial color="#ff5a00" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

const Planet = ({ planet, offset }: { planet: PlanetDef; offset: number }) => {
  const orbitRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createPlanetTexture(planet), [planet]);
  const clouds = useMemo(() => (planet.kind === "earth" || planet.kind === "venus" ? createCloudTexture() : null), [planet.kind]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * planet.speed + offset;
    if (orbitRef.current) {
      orbitRef.current.position.x = Math.cos(t) * planet.distance;
      orbitRef.current.position.z = Math.sin(t) * planet.distance;
    }
    if (meshRef.current) meshRef.current.rotation.y += planet.kind === "gas" ? 0.006 : 0.011;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.014;
  });

  const orbitLine = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * planet.distance, 0, Math.sin(a) * planet.distance));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
    return new THREE.LineLoop(geom, mat);
  }, [planet.distance]);

  return (
    <>
      <primitive object={orbitLine} />
      <group ref={orbitRef}>
        <group rotation={[0, 0, planet.tilt ?? 0]}>
          <mesh ref={meshRef} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[planet.size, isMobile ? 32 : 56, isMobile ? 32 : 56]} />

            <meshStandardMaterial
              map={texture}
              emissive={planet.emissive ?? "#000000"}
              emissiveIntensity={0.12}
              roughness={planet.kind === "gas" || planet.kind === "ice" ? 0.58 : 0.92}
              metalness={0.02}
            />
          </mesh>
          {clouds && (
            <mesh ref={cloudsRef} scale={1.025}>
              <sphereGeometry args={[planet.size, 64, 64]} />
              <meshBasicMaterial map={clouds} transparent opacity={planet.kind === "venus" ? 0.42 : 0.32} depthWrite={false} />
            </mesh>
          )}
          {planet.atmosphere && (
            <mesh scale={1.1}>
              <sphereGeometry args={[planet.size, 48, 48]} />
              <meshBasicMaterial color={planet.atmosphere} transparent opacity={0.16} blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} />
            </mesh>
          )}
          {planet.ring && (
            <mesh rotation={[Math.PI / 2.15, 0, 0]}>
              <ringGeometry args={[planet.size * planet.ring.inner, planet.size * planet.ring.outer, 128]} />
              <meshBasicMaterial color={planet.ring.color} side={THREE.DoubleSide} transparent opacity={0.72} />
            </mesh>
          )}
        </group>
        <Html center distanceFactor={isMobile ? 9 : 12} position={[0, -planet.size - 0.24, 0]}>
          <span className="rounded-full border border-primary/20 bg-background/55 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
            {planet.name}
          </span>
        </Html>
      </group>
    </>
  );
};

const Scene = () => (
  <>
    <ambientLight intensity={0.22} />
    <directionalLight position={[7, 8, 10]} intensity={0.8} color="#bfefff" />
    <Stars radius={180} depth={80} count={isMobile ? 500 : 1800} factor={4.5} fade speed={0.35} />
    <Sun />
    {PLANETS.map((p, i) => (
      <Planet key={p.name} planet={p} offset={i * 1.25} />
    ))}
  </>
);

const LoadingFallback = () => (
  <Html center>
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-primary text-sm mt-2">Loading solar system…</p>
    </div>
  </Html>
);

const SolarSystem = ({ height = "min(1100px, 92vh)", className = "" }: SolarSystemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [inViewport, setInViewport] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl =
        (c.getContext("webgl2") as WebGL2RenderingContext | null) ||
        (c.getContext("webgl") as WebGLRenderingContext | null) ||
        (c.getContext("experimental-webgl") as WebGLRenderingContext | null);
      if (!gl) setWebglFailed(true);
    } catch {
      setWebglFailed(true);
    }
  }, []);

  useEffect(() => {
    const onVis = () => setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInViewport(entries[0]?.isIntersecting ?? true),
      { rootMargin: "120px", threshold: 0.01 }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  if (webglFailed) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full mx-auto overflow-hidden border border-primary/20 glass-ultra flex items-center justify-center ${className}`}
        style={{ height }}
        role="img"
        aria-label="3D solar system preview (unavailable on this device)"
      >
        <div className="text-center px-6 max-w-md">
          <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fbbf24,#f97316_55%,#7c2d12)] shadow-[0_0_60px_rgba(251,191,36,0.5)]" />
          <h3 className="text-lg font-semibold text-foreground mb-2">3D preview unavailable</h3>
          <p className="text-sm text-muted-foreground">
            Your browser couldn't create a WebGL context. Try updating your browser, enabling hardware acceleration, or disabling privacy extensions that block WebGL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full mx-auto overflow-hidden border border-primary/20 glass-ultra ${className}`}
      style={{ height }}
      aria-label="Interactive realistic 3D solar system"
      role="img"
    >
      <Canvas
        shadows={false}
        camera={{ position: [0, 11, 26], fov: 58 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }}
        style={{ background: "transparent" }}
        dpr={isMobile ? 1 : [1, 1.5]}
        performance={{ min: 0.45 }}
        frameloop={isVisible && inViewport ? "always" : "demand"}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              setWebglFailed(true);
            },
            false
          );
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
          <OrbitControls enablePan={false} enableZoom minDistance={6} maxDistance={48} autoRotate autoRotateSpeed={0.18} enableDamping dampingFactor={0.06} />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-3 left-3 rounded-md border border-border/40 bg-background/50 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur-md pointer-events-none">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};


export default SolarSystem;
