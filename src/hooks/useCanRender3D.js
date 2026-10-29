import { useEffect, useRef, useState } from 'react';

// True only when the device can realistically run the WebGL scene:
// no reduced-motion preference, enough cores, and a working WebGL context.
// Used to decide between the 3D canvas and the lightweight CSS fallback.
export function useCanRender3D() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const detect = () => {
      try {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const cores = navigator.hardwareConcurrency ?? 4;
        const memory = navigator.deviceMemory ?? 4;

        const canvas = document.createElement('canvas');
        const gl =
          canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl');

        const supported = Boolean(gl) && !reduce && cores >= 4 && memory >= 3;
        if (!cancelled) setOk(supported);
      } catch {
        if (!cancelled) setOk(false);
      }
    };

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return ok;
}

// Small helper so the scene can also be forced off (e.g. by a user toggle).
export function useOnDemand3D(initiallyEnabled = false) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const capable = useCanRender3D();
  const ref = useRef(null);
  return { enabled: enabled && capable, toggle: () => setEnabled((e) => !e), capable, mountRef: ref };
}
