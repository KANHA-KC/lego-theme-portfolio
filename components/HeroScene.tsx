'use client';

import React, { useEffect, useRef } from 'react';
import type * as THREENS from 'three';

type ThreeModule = typeof THREENS;

interface LightPreset {
  ambientColor: number;
  ambientIntensity: number;
  keyColor: number;
  keyIntensity: number;
  rimColor: number;
  rimIntensity: number;
}

const LIGHT_PRESETS: Record<'light' | 'dark', LightPreset> = {
  light: {
    ambientColor: 0xffffff,
    ambientIntensity: 1.25,
    keyColor: 0xffffff,
    keyIntensity: 2.3,
    rimColor: 0xfff1c2,
    rimIntensity: 1.4,
  },
  dark: {
    ambientColor: 0xb8c4d6,
    ambientIntensity: 0.75,
    keyColor: 0xffffff,
    keyIntensity: 2.0,
    rimColor: 0xffcd03, // brick yellow glow from behind
    rimIntensity: 2.6,
  },
};

// Brick palette for the figure (sRGB hex; three converts to linear).
const COLORS = {
  skin: 0xf2cd37,
  torso: 0xd01012,
  legs: 0x0a3463,
  hair: 0x4a2c17,
  plate: 0x00852b,
};

const currentThemeName = (): 'light' | 'dark' =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

/** Moulded-ABS look: glossy, non-metallic. */
function plastic(THREE: ThreeModule, color: number, map?: THREENS.Texture) {
  return new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : color,
    ...(map ? { map } : {}),
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  });
}

/** Face print, wrapped around the head (u = around, v = height). */
function makeFaceTexture(THREE: ThreeModule) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 280;
  const g = c.getContext('2d')!;
  g.fillStyle = '#F2CD37';
  g.fillRect(0, 0, c.width, c.height);

  const cx = c.width / 2; // u = 0.5 faces the camera (see phiStart below)
  g.strokeStyle = '#1B1B1B';
  g.lineCap = 'round';

  // Eyebrows
  g.lineWidth = 11;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * 30, 84);
    g.quadraticCurveTo(cx + s * 46, 74, cx + s * 64, 80);
    g.stroke();
  }

  // Eyes with a highlight
  for (const s of [-1, 1]) {
    g.fillStyle = '#1B1B1B';
    g.beginPath();
    g.ellipse(cx + s * 46, 118, 12, 16, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(cx + s * 46 - 4, 112, 4.5, 0, Math.PI * 2);
    g.fill();
  }

  // Lopsided grin
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(cx - 52, 172);
  g.quadraticCurveTo(cx, 222, cx + 58, 164);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Torso print: open jacket over a white tee, zip and pocket. */
function makeTorsoTexture(THREE: ThreeModule) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#D01012';
  g.fillRect(0, 0, 512, 512);

  // White tee showing through the open jacket
  g.fillStyle = '#F4F4F4';
  g.beginPath();
  g.moveTo(186, 0);
  g.lineTo(326, 0);
  g.lineTo(300, 512);
  g.lineTo(212, 512);
  g.closePath();
  g.fill();

  // Collar
  g.fillStyle = '#8E0A0C';
  g.beginPath();
  g.moveTo(150, 0);
  g.lineTo(206, 0);
  g.lineTo(236, 120);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(362, 0);
  g.lineTo(306, 0);
  g.lineTo(276, 120);
  g.closePath();
  g.fill();

  // Jacket edges
  g.strokeStyle = '#8E0A0C';
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(206, 0);
  g.lineTo(212, 512);
  g.moveTo(306, 0);
  g.lineTo(300, 512);
  g.stroke();

  // Pocket with a yellow pen
  g.lineWidth = 8;
  g.strokeRect(352, 250, 86, 70);
  g.fillStyle = '#FFCD03';
  g.fillRect(372, 222, 14, 44);

  // Belt line
  g.fillStyle = '#8E0A0C';
  g.fillRect(0, 488, 512, 24);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Builds the brick figure. Local units: feet at y = 0, top of hair ≈ 3.2.
 * Returns the root plus the parts that animate.
 */
function buildFigure(THREE: ThreeModule) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = plastic(THREE, COLORS.skin);
  const legsMat = plastic(THREE, COLORS.legs);
  const torsoMat = plastic(THREE, COLORS.torso);
  const hairMat = plastic(THREE, COLORS.hair);
  hairMat.side = THREE.DoubleSide;
  const plateMat = plastic(THREE, COLORS.plate);

  // --- Green plate with studs (6 x 4) -------------------------------------
  const plateY = -0.1;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 1.36), plateMat);
  plate.position.y = plateY;
  root.add(plate);

  const studs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 24), plateMat, 24);
  const m = new THREE.Matrix4();
  let n = 0;
  for (let ix = 0; ix < 6; ix++) {
    for (let iz = 0; iz < 4; iz++) {
      m.makeTranslation(-0.835 + ix * 0.334, plateY + 0.12, -0.5 + iz * 0.334);
      studs.setMatrixAt(n++, m);
    }
  }
  root.add(studs);

  // --- Legs, feet, hips --------------------------------------------------
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.47, 1.0, 0.55), legsMat);
    leg.position.set(s * 0.255, 0.82, 0);
    body.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.32, 0.72), legsMat);
    foot.position.set(s * 0.255, 0.16, 0.08);
    body.add(foot);
  }
  const hips = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.56), legsMat);
  hips.position.y = 1.41;
  body.add(hips);

  // --- Torso: tapered box, printed on the front face only ------------------
  const torsoGeo = new THREE.BoxGeometry(1.0, 1.0, 0.52);
  const tp = torsoGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    if (tp.getY(i) > 0) tp.setX(i, tp.getX(i) * 0.72);
  }
  torsoGeo.computeVertexNormals();
  const torsoFront = plastic(THREE, COLORS.torso, makeTorsoTexture(THREE));
  // BoxGeometry material order: +x, -x, +y, -y, +z (front), -z
  const torso = new THREE.Mesh(torsoGeo, [torsoMat, torsoMat, torsoMat, torsoMat, torsoFront, torsoMat]);
  torso.position.y = 2.01;
  body.add(torso);

  // --- Arms (pivot at the shoulder so they can swing) ----------------------
  const makeArm = (side: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.4, 2.36, 0);

    pivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), torsoMat));

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.66, 24), torsoMat);
    arm.position.set(side * 0.07, -0.33, 0.04);
    arm.rotation.z = side * 0.18;
    pivot.add(arm);

    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.12, 16), skin);
    wrist.position.set(side * 0.13, -0.7, 0.07);
    pivot.add(wrist);

    // C-shaped hand, opening facing forward
    const hand = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.05, 14, 28, Math.PI * 1.55), skin);
    hand.position.set(side * 0.14, -0.84, 0.1);
    hand.rotation.set(Math.PI / 2, 0, Math.PI * 0.72);
    pivot.add(hand);

    body.add(pivot);
    return pivot;
  };
  const armRight = makeArm(1); // viewer's right: the waving arm
  const armLeft = makeArm(-1);

  // --- Head group (turns to follow the pointer) ----------------------------
  const head = new THREE.Group();
  head.position.y = 2.52;
  body.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 24), skin);
  neck.position.y = 0.04;
  head.add(neck);

  // Rounded-cylinder head via a lathe profile.
  const H = 0.56;
  const R = 0.33;
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R - 0.05, 0),
    new THREE.Vector2(R - 0.015, 0.012),
    new THREE.Vector2(R, 0.05),
    new THREE.Vector2(R, H - 0.05),
    new THREE.Vector2(R - 0.015, H - 0.012),
    new THREE.Vector2(R - 0.05, H),
    new THREE.Vector2(0, H),
  ];
  // phiStart = PI puts u = 0.5 (centre of the face print) on +z.
  const headGeo = new THREE.LatheGeometry(profile, 48, Math.PI, Math.PI * 2);
  // Map v by height so the face print isn't stretched by the profile spacing.
  const hp = headGeo.attributes.position;
  const huv = headGeo.attributes.uv;
  for (let i = 0; i < hp.count; i++) huv.setY(i, hp.getY(i) / H);
  const headMesh = new THREE.Mesh(headGeo, plastic(THREE, COLORS.skin, makeFaceTexture(THREE)));
  headMesh.position.y = 0.08;
  head.add(headMesh);

  // Short, side-swept hair: crown cap, back/sides band, and a fringe.
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMat
  );
  cap.scale.set(1, 0.62, 1.02);
  cap.position.y = 0.08 + H - 0.08;
  head.add(cap);

  const back = new THREE.Mesh(
    new THREE.CylinderGeometry(0.355, 0.355, 0.3, 40, 1, true, Math.PI * 0.32, Math.PI * 1.36),
    hairMat
  );
  back.position.y = 0.08 + H - 0.18;
  head.add(back);

  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), hairMat);
  fringe.scale.set(1.5, 0.42, 0.7);
  fringe.position.set(0.09, 0.08 + H - 0.04, 0.24);
  fringe.rotation.z = -0.22;
  head.add(fringe);

  // Feet sit on the plate studs.
  body.position.y = 0.06;

  return { root, body, head, armRight, armLeft };
}

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

        let preset = LIGHT_PRESETS[currentThemeName()];

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          38,
          window.innerWidth / window.innerHeight,
          0.1,
          100
        );
        camera.position.set(0, 0.35, 6.2);
        camera.lookAt(0, 0.1, 0);

        const renderer = new THREE.WebGLRenderer({
          canvas: canvas!,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        // 1.5x is visually indistinguishable here and renders ~44% fewer pixels than 2x.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const { root, body, head, armRight, armLeft } = buildFigure(THREE);
        root.scale.setScalar(0.82);
        scene.add(root);

        const ambientLight = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity);
        scene.add(ambientLight);
        const keyLight = new THREE.DirectionalLight(preset.keyColor, preset.keyIntensity);
        keyLight.position.set(-3, 5, 5);
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(preset.rimColor, preset.rimIntensity);
        rimLight.position.set(3, 2, -4);
        scene.add(rimLight);

        const targetAmbient = new THREE.Color(preset.ambientColor);
        const targetKey = new THREE.Color(preset.keyColor);
        const targetRim = new THREE.Color(preset.rimColor);

        const updateSceneTheme = () => {
          preset = LIGHT_PRESETS[currentThemeName()];
          targetAmbient.setHex(preset.ambientColor);
          targetKey.setHex(preset.keyColor);
          targetRim.setHex(preset.rimColor);
        };

        const observer = new MutationObserver(updateSceneTheme);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme'],
        });
        window.addEventListener('theme-change', updateSceneTheme);

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        const onMouseMove = (e: MouseEvent) => {
          targetX = e.clientX / window.innerWidth - 0.5;
          targetY = e.clientY / window.innerHeight - 0.5;
        };
        window.addEventListener('mousemove', onMouseMove, { passive: true });

        // Keep the figure in the right-hand third, clear of the hero text.
        const getBaseX = () => {
          const aspect = window.innerWidth / window.innerHeight;
          return Math.min(Math.max(aspect * 0.95, 1.2), 2.0);
        };

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        let scrollProgress = 0;
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);
        const scrollTriggerInstance = ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: '850px top',
          scrub: 1.2,
          onUpdate: (self) => {
            scrollProgress = self.progress;
          },
        });

        const WAVE_EVERY = 6.5; // seconds between waves
        const WAVE_LENGTH = 2.2;
        const clock = new THREE.Clock();
        let elapsed = 0;

        // Only render while the hero is on screen; scrolled-away frames are wasted GPU work.
        let running = false;
        const animate = () => {
          if (!running) return;
          animationFrameId = requestAnimationFrame(animate);

          const delta = Math.min(clock.getDelta(), 0.1);
          elapsed += delta;

          currentX += (targetX - currentX) * 0.06;
          currentY += (targetY - currentY) * 0.06;

          // Whole figure: placement, idle bob, scroll spin-away.
          root.position.x = getBaseX();
          root.position.y = -1.32 + Math.sin(elapsed * 1.6) * 0.035 + scrollProgress * 0.8;
          root.position.z = -scrollProgress * 2.5;
          root.rotation.y = -0.38 + currentX * 0.35 + scrollProgress * Math.PI * 1.2;

          // Head follows the pointer more than the body does.
          head.rotation.y = currentX * 0.9;
          head.rotation.x = currentY * 0.35;
          body.rotation.y = Math.sin(elapsed * 0.7) * 0.04;

          // Wave: raise the arm, wave from the shoulder, lower it.
          const t = (elapsed + 1.2) % WAVE_EVERY;
          let raise = 0;
          let wiggle = 0;
          if (t < WAVE_LENGTH) {
            const p = t / WAVE_LENGTH;
            raise = Math.sin(Math.min(p / 0.2, 1) * (Math.PI / 2)) * (p > 0.8 ? (1 - p) / 0.2 : 1);
            wiggle = Math.sin(t * 13) * 0.32 * raise;
          }
          armRight.rotation.z = raise * 2.5 + wiggle;
          armRight.rotation.x = -raise * 0.25;
          armLeft.rotation.x = Math.sin(elapsed * 1.6) * 0.08;

          if (canvas) {
            canvas.style.opacity = `${Math.max(0, 1 - scrollProgress * 1.1)}`;
          }

          ambientLight.color.lerp(targetAmbient, 0.06);
          ambientLight.intensity += (preset.ambientIntensity - ambientLight.intensity) * 0.06;
          keyLight.color.lerp(targetKey, 0.06);
          keyLight.intensity += (preset.keyIntensity - keyLight.intensity) * 0.06;
          rimLight.color.lerp(targetRim, 0.06);
          rimLight.intensity += (preset.rimIntensity - rimLight.intensity) * 0.06;

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
          scrollTriggerInstance.kill();
          observer.disconnect();
          visibilityObserver.disconnect();
          running = false;
          window.removeEventListener('theme-change', updateSceneTheme);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
          cancelAnimationFrame(animationFrameId);
          scene.traverse((obj) => {
            const mesh = obj as THREENS.Mesh;
            if (!mesh.isMesh) return;
            mesh.geometry.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => {
              (mat as THREENS.MeshPhysicalMaterial).map?.dispose();
              mat.dispose();
            });
          });
          renderer.dispose();
        };
      } catch (err) {
        console.warn('Hero figure failed to initialize:', err);
        if (canvas) canvas.style.display = 'none';
      }
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
