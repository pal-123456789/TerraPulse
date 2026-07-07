import { useEffect, useState } from "react";

/**
 * Detects whether the current browser/device can create a WebGL context.
 * Returns `true` while probing so components render optimistically, then
 * flips to `false` if creation fails (older iOS, hardened browsers, headless
 * envs, some VMs / privacy extensions).
 */
export function useWebGLSupported(): boolean {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl =
        (c.getContext("webgl2") as WebGL2RenderingContext | null) ||
        (c.getContext("webgl") as WebGLRenderingContext | null) ||
        (c.getContext("experimental-webgl") as WebGLRenderingContext | null);
      if (!gl) setSupported(false);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
