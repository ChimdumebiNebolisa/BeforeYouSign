"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function BackgroundBeams() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const lightBlue = new THREE.Color("#60a5fa");

    const beams: Array<{
      mesh: THREE.Mesh;
      phase: number;
      speed: number;
      baseY: number;
      baseX: number;
      baseRotZ: number;
      opacity: number;
    }> = [];

    // Subtle, limited set of additive “planes” to keep motion light.
    const beamCount = 10;
    for (let i = 0; i < beamCount; i++) {
      const width = 0.45 + Math.random() * 0.35;
      const height = 3.2 + Math.random() * 2.6;

      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: lightBlue,
        transparent: true,
        opacity: 0.06 + Math.random() * 0.05,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const baseX = (Math.random() - 0.5) * 6;
      const baseY = (Math.random() - 0.5) * 4;
      const baseRotZ = (Math.random() - 0.5) * 0.4;

      // Tilt into the scene so the “beam” reads as a streak.
      mesh.rotation.x = Math.PI * 0.5;
      mesh.rotation.z = baseRotZ;
      mesh.position.set(baseX, baseY, (Math.random() - 0.5) * 2);

      scene.add(mesh);

      beams.push({
        mesh,
        phase: Math.random() * Math.PI * 2,
        speed: 0.07 + Math.random() * 0.12,
        baseX,
        baseY,
        baseRotZ,
        opacity: (material.opacity as number) ?? 0.08,
      });
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    const start = performance.now();

    const animate = () => {
      const t = (performance.now() - start) / 1000;

      for (const beam of beams) {
        // Very small drift for subtle visibility.
        beam.mesh.position.y = beam.baseY + Math.sin(t * beam.speed + beam.phase) * 0.22;
        beam.mesh.position.x = beam.baseX + Math.cos(t * beam.speed * 0.7 + beam.phase) * 0.18;
        beam.mesh.rotation.z = beam.baseRotZ + Math.sin(t * beam.speed + beam.phase) * 0.03;

        const pulse = 0.5 + 0.5 * Math.sin(t * (beam.speed * 0.6) + beam.phase);
        (beam.mesh.material as THREE.MeshBasicMaterial).opacity = beam.opacity * (0.75 + pulse * 0.25);
      }

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
      renderer.dispose();
      scene.clear();
      beams.forEach((beam) => {
        beam.mesh.geometry.dispose();
        (beam.mesh.material as THREE.MeshBasicMaterial).dispose();
      });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-screen w-screen"
    />
  );
}

