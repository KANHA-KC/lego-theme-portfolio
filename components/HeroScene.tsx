'use client';

import React, { useEffect, useRef } from 'react';

interface ThemePreset {
  sculptureColor: number;
  roughness: number;
  metalness: number;
  ambientColor: number;
  ambientIntensity: number;
  keyColor: number;
  keyIntensity: number;
  rimColor: number;
  rimIntensity: number;
  fallbackStroke: string;
}

const THEME_PRESETS: Record<string, ThemePreset> = {
  light: {
    sculptureColor: 0x111111,       // Precision Obsidian / Chrome
    roughness: 0.22,
    metalness: 0.85,
    ambientColor: 0xffffff,
    ambientIntensity: 1.5,
    keyColor: 0xffffff,
    keyIntensity: 2.4,
    rimColor: 0xff0000,             // Bold Red rim (#FF0000)
    rimIntensity: 2.8,
    fallbackStroke: 'rgba(255, 0, 0, 0.4)',
  },
  dark: {
    sculptureColor: 0x141414,       // Deep Noir Glass
    roughness: 0.20,
    metalness: 0.90,
    ambientColor: 0x1a1a1a,
    ambientIntensity: 1.2,
    keyColor: 0xffffff,
    keyIntensity: 1.9,
    rimColor: 0xd2f75a,             // Electric Volt Neon rim (#D2F75A)
    rimIntensity: 3.0,
    fallbackStroke: 'rgba(210, 247, 90, 0.45)',
  },
  paper: {
    sculptureColor: 0x111111,
    roughness: 0.22,
    metalness: 0.85,
    ambientColor: 0xffffff,
    ambientIntensity: 1.5,
    keyColor: 0xffffff,
    keyIntensity: 2.4,
    rimColor: 0xff0000,
    rimIntensity: 2.8,
    fallbackStroke: 'rgba(255, 0, 0, 0.4)',
  },
  clay: {
    sculptureColor: 0x111111,
    roughness: 0.22,
    metalness: 0.85,
    ambientColor: 0xffffff,
    ambientIntensity: 1.5,
    keyColor: 0xffffff,
    keyIntensity: 2.4,
    rimColor: 0xff0000,
    rimIntensity: 2.8,
    fallbackStroke: 'rgba(255, 0, 0, 0.4)',
  },
  v2_light: {
    sculptureColor: 0x111111,
    roughness: 0.22,
    metalness: 0.85,
    ambientColor: 0xffffff,
    ambientIntensity: 1.5,
    keyColor: 0xffffff,
    keyIntensity: 2.4,
    rimColor: 0xff0000,
    rimIntensity: 2.8,
    fallbackStroke: 'rgba(255, 0, 0, 0.4)',
  },
  v2_dark: {
    sculptureColor: 0x141414,
    roughness: 0.20,
    metalness: 0.90,
    ambientColor: 0x1a1a1a,
    ambientIntensity: 1.2,
    keyColor: 0xffffff,
    keyIntensity: 1.9,
    rimColor: 0xd2f75a,
    rimIntensity: 3.0,
    fallbackStroke: 'rgba(210, 247, 90, 0.45)',
  },
};

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;

    if (prefersReducedMotion || isMobile) {
      canvas.style.display = 'none';
      return;
    }

    let animationFrameId: number;
    let cleanupThree: (() => void) | null = null;

    async function init() {
      try {
        const THREE = await import('three');

        const initialTheme =
          (typeof document !== 'undefined' &&
            document.documentElement.getAttribute('data-theme')) ||
          'dark';
        let targetPreset = initialTheme === 'dark' ? THEME_PRESETS.dark : THEME_PRESETS.light;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          42,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 4.6;
        camera.position.x = 0;

        const renderer = new THREE.WebGLRenderer({
          canvas: canvas!,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        // 1.5x is visually indistinguishable here and renders ~44% fewer pixels than 2x.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        // Authentic 3D Lego Brick Geometry (Box + Cylindrical Top Stud)
        const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');

        const brickW = 0.20;
        const brickH = 0.15;
        const brickD = 0.20;
        const boxGeo = new THREE.BoxGeometry(brickW, brickH, brickD);

        const studRadius = 0.056;
        const studHeight = 0.042;
        const studGeo = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 14);
        studGeo.translate(0, brickH / 2 + studHeight / 2, 0);

        const legoBrickGeo = mergeGeometries([boxGeo, studGeo]);

        // Sample along a Torus Knot curve to form an interlocking Lego brick sculpture
        const baseGeo = new THREE.TorusKnotGeometry(1.0, 0.35, 110, 22, 2, 3);
        const posAttr = baseGeo.attributes.position;
        const step = 0.20;
        const brickPositions: InstanceType<typeof THREE.Vector3>[] = [];
        const seen = new Set<string>();

        for (let i = 0; i < posAttr.count; i++) {
          const x = Math.round(posAttr.getX(i) / step) * step;
          const y = Math.round(posAttr.getY(i) / step) * step;
          const z = Math.round(posAttr.getZ(i) / step) * step;
          const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
          if (!seen.has(key)) {
            seen.add(key);
            brickPositions.push(new THREE.Vector3(x, y, z));
          }
        }
        baseGeo.dispose();

        // Lego ABS Plastic Material with glossy sheen
        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.22,
          metalness: 0.15,
        });

        const sculpture = new THREE.InstancedMesh(legoBrickGeo, material, brickPositions.length);
        const dummy = new THREE.Object3D();

        brickPositions.forEach((pos, i) => {
          dummy.position.copy(pos);
          dummy.rotation.set(0, 0, 0); // Lego studs point vertically up
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          sculpture.setMatrixAt(i, dummy.matrix);
        });
        sculpture.instanceMatrix.needsUpdate = true;
        sculpture.scale.set(0.85, 0.85, 0.85);
        scene.add(sculpture);

        const updateInstanceColors = (themeName: string) => {
          const isDark = themeName === 'dark';
          const baseColor = new THREE.Color(isDark ? 0x141416 : 0xf2f2f5);
          const accentColor = new THREE.Color(isDark ? 0xd2f75a : 0xff0000);
          const tempColor = new THREE.Color();

          brickPositions.forEach((pos, i) => {
            // ~15% accent bricks distributed across the sculpture
            const isAccent = (i % 7 === 0) || Math.sin(pos.x * 3.5 + pos.z * 2.8) > 0.72;
            if (isAccent) {
              sculpture.setColorAt(i, accentColor);
            } else {
              const variance = Math.sin(pos.y * 5) * 0.035;
              tempColor.copy(baseColor);
              if (isDark) {
                tempColor.offsetHSL(0, 0, variance);
              } else {
                tempColor.offsetHSL(0, 0, -Math.abs(variance));
              }
              sculpture.setColorAt(i, tempColor);
            }
          });
          if (sculpture.instanceColor) {
            sculpture.instanceColor.needsUpdate = true;
          }
        };

        updateInstanceColors(initialTheme);

        // Ambient & Directional Lighting
        const ambientLight = new THREE.AmbientLight(
          targetPreset.ambientColor,
          targetPreset.ambientIntensity
        );
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(
          targetPreset.keyColor,
          targetPreset.keyIntensity
        );
        keyLight.position.set(3, 4, 4);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(
          targetPreset.rimColor,
          targetPreset.rimIntensity
        );
        rimLight.position.set(-2, -2, -2);
        scene.add(rimLight);

        // Target color vectors for smooth lerping
        const targetSculptureColor = new THREE.Color(targetPreset.sculptureColor);
        const targetAmbientColor = new THREE.Color(targetPreset.ambientColor);
        const targetKeyColor = new THREE.Color(targetPreset.keyColor);
        const targetRimColor = new THREE.Color(targetPreset.rimColor);

        const updateSceneTheme = () => {
          const themeName =
            (typeof document !== 'undefined' &&
              document.documentElement.getAttribute('data-theme')) ||
            'dark';

          const preset = themeName === 'dark' ? THEME_PRESETS.dark : THEME_PRESETS.light;

          targetPreset = preset;
          targetSculptureColor.setHex(preset.sculptureColor);
          targetAmbientColor.setHex(preset.ambientColor);
          targetKeyColor.setHex(preset.keyColor);
          targetRimColor.setHex(preset.rimColor);
          updateInstanceColors(themeName);
        };

        // MutationObserver to watch data-theme and data-version on <html>
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.attributeName === 'data-theme' || m.attributeName === 'data-version') {
              updateSceneTheme();
            }
          }
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme', 'data-version'],
        });

        // Window custom event listeners as backup
        window.addEventListener('theme-change', updateSceneTheme);
        window.addEventListener('version-change', updateSceneTheme);

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const onMouseMove = (e: MouseEvent) => {
          targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
          targetY = (e.clientY / window.innerHeight - 0.5) * 0.6;
        };
        window.addEventListener('mousemove', onMouseMove);

        const getBaseX = () => {
          const aspect = window.innerWidth / window.innerHeight;
          return Math.min(Math.max(aspect * 0.95, 1.25), 1.85);
        };

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        let scrollProgress = 0;
        let scrollTriggerInstance: any = null;

        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        scrollTriggerInstance = ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: '850px top',
          scrub: 1.2,
          onUpdate: (self) => {
            scrollProgress = self.progress;
          },
        });

        const clock = new THREE.Clock();
        // Only render while the hero is on screen; scrolled-away frames are wasted GPU work.
        let running = false;
        const animate = () => {
          if (!running) return;
          animationFrameId = requestAnimationFrame(animate);

          const delta = clock.getDelta();
          sculpture.rotation.x += delta * 0.22;
          sculpture.rotation.y += delta * 0.28;
          sculpture.rotation.z = scrollProgress * 0.65;

          currentX += (targetX - currentX) * 0.05;
          currentY += (targetY - currentY) * 0.05;

          const baseX = getBaseX();
          sculpture.position.x = baseX + currentX;
          sculpture.position.y = 0.05 - currentY - scrollProgress * 1.6;
          sculpture.position.z = -scrollProgress * 2.2;

          if (canvas) {
            canvas.style.opacity = `${Math.max(0, 1 - scrollProgress * 1.1)}`;
          }

          // Smoothly interpolate material roughness, metalness, and lighting
          material.roughness += (targetPreset.roughness - material.roughness) * 0.055;
          material.metalness += (targetPreset.metalness - material.metalness) * 0.055;

          ambientLight.color.lerp(targetAmbientColor, 0.055);
          ambientLight.intensity +=
            (targetPreset.ambientIntensity - ambientLight.intensity) * 0.055;

          keyLight.color.lerp(targetKeyColor, 0.055);
          keyLight.intensity +=
            (targetPreset.keyIntensity - keyLight.intensity) * 0.055;

          rimLight.color.lerp(targetRimColor, 0.055);
          rimLight.intensity +=
            (targetPreset.rimIntensity - rimLight.intensity) * 0.055;

          renderer.render(scene, camera);
        };

        const visibilityObserver = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !running) {
            running = true;
            clock.getDelta(); // drop the time spent paused
            animate();
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(animationFrameId);
          }
        });
        visibilityObserver.observe(canvas!);

        cleanupThree = () => {
          if (scrollTriggerInstance) scrollTriggerInstance.kill();
          observer.disconnect();
          visibilityObserver.disconnect();
          running = false;
          window.removeEventListener('theme-change', updateSceneTheme);
          window.removeEventListener('version-change', updateSceneTheme);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
          cancelAnimationFrame(animationFrameId);
          renderer.dispose();
          sculpture.dispose();
          legoBrickGeo.dispose();
          boxGeo.dispose();
          studGeo.dispose();
          material.dispose();
        };
      } catch (err) {
        console.warn(
          'Three.js failed to initialize, falling back to 2D canvas animation:',
          err
        );
        initFallback();
      }
    }

    function initFallback() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', resize);
      resize();

      const getCurrentFallbackPreset = () => {
        const t =
          (typeof document !== 'undefined' &&
            document.documentElement.getAttribute('data-theme')) ||
          'dark';
        return t === 'dark' ? 'dark' : 'light';
      };

      let currentTheme = getCurrentFallbackPreset();

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.attributeName === 'data-theme' || m.attributeName === 'data-version') {
            currentTheme = getCurrentFallbackPreset();
          }
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-version'],
      });

      let angle = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width * 0.72;
        const cy = canvas.height * 0.45;
        const r = Math.min(canvas.width, canvas.height) * 0.22;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        const preset = THEME_PRESETS[currentTheme] || THEME_PRESETS.paper;
        ctx.strokeStyle = preset.fallbackStroke;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            r + i * 18,
            (r + i * 18) * 0.65,
            (i * Math.PI) / 5,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
        ctx.restore();

        angle += 0.003;
        animationFrameId = requestAnimationFrame(draw);
      };
      draw();

      cleanupThree = () => {
        observer.disconnect();
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
      };
    }

    // init() is async (dynamic imports), so the component may unmount before it
    // finishes; tear down as soon as it does instead of leaking the render loop.
    let disposed = false;
    init().then(() => {
      if (disposed && cleanupThree) cleanupThree();
    });

    return () => {
      disposed = true;
      if (cleanupThree) cleanupThree();
    };
  }, []);

  return <canvas id="scene" ref={canvasRef} aria-hidden="true" />;
}
