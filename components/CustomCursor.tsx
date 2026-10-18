'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { liquidGlass } from '@/lib/liquid-glass';

export default function CustomCursor() {
  const [cursorState, setCursorState] = useState<{
    hovering: boolean;
    type: string;
    label: string;
  }>({
    hovering: false,
    type: '',
    label: '',
  });

  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Initialize liquid glass optics on the cursor ring/blob
  useEffect(() => {
    if (!ringRef.current) return;
    const glass = liquidGlass(ringRef.current, {
      scale: -80,
      chroma: 4,
      border: 0.1,
      mapBlur: 8,
      blur: 2.5,
      saturate: 1.6,
      fallbackBlur: 14,
    });
    return () => glass.destroy();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    document.documentElement.classList.add('has-custom-cursor');

    // Set up optimized GSAP quickTo setters for instant and critically-damped coordinates
    const setDotX = gsap.quickTo(dotRef.current, 'x', { duration: 0.04, ease: 'power1.out' });
    const setDotY = gsap.quickTo(dotRef.current, 'y', { duration: 0.04, ease: 'power1.out' });

    const setRingX = gsap.quickTo(ringRef.current, 'x', { duration: 0.18, ease: 'power2.out' });
    const setRingY = gsap.quickTo(ringRef.current, 'y', { duration: 0.18, ease: 'power2.out' });

    const setLabelX = gsap.quickTo(labelRef.current, 'x', { duration: 0.18, ease: 'power2.out' });
    const setLabelY = gsap.quickTo(labelRef.current, 'y', { duration: 0.18, ease: 'power2.out' });

    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!hasMoved) {
        hasMoved = true;
        setIsVisible(true);
        if (dotRef.current && ringRef.current && labelRef.current) {
          gsap.set([dotRef.current, ringRef.current, labelRef.current], {
            x: e.clientX,
            y: e.clientY,
          });
        }
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
      setLabelX(e.clientX);
      setLabelY(e.clientY);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Hide/show cursor when mouse exits/enters document viewport
    const handleDocumentLeave = () => setIsVisible(false);
    const handleDocumentEnter = () => setIsVisible(true);

    document.addEventListener('mouseleave', handleDocumentLeave);
    document.addEventListener('mouseenter', handleDocumentEnter);

    // Pointer press reactions
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Dynamic delegation for hover states on buttons, links, and interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const target = el?.closest<HTMLElement>(
        '[data-cursor], a, button, .btn, .nav__theme-btn, input, textarea, select, [role="button"], label, .work-card, .process-card, .orbit__node'
      );
      if (target) {
        const type = target.getAttribute('data-cursor') || 'hover';
        // Only show explicit labels if explicitly designated with data-cursor-label,
        // so button/link text stays visible through the inverted blob
        const explicitLabel = target.getAttribute('data-cursor-label') || '';
        setCursorState({
          hovering: true,
          type,
          label: explicitLabel,
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const target = el?.closest<HTMLElement>(
        '[data-cursor], a, button, .btn, .nav__theme-btn, input, textarea, select, [role="button"], label, .work-card, .process-card, .orbit__node'
      );
      if (target) {
        setCursorState({
          hovering: false,
          type: '',
          label: '',
        });
      }
    };

    // Magnetic buttons with GSAP elastic release physics
    const handleMagneticMove = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const magnet = el?.closest<HTMLElement>('.btn--magnetic, .btn--primary');
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        gsap.to(magnet, {
          x: x * 0.22,
          y: y * 0.22,
          duration: 0.35,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    };

    const handleMagneticLeave = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const magnet = el?.closest<HTMLElement>('.btn--magnetic, .btn--primary');
      if (magnet) {
        gsap.to(magnet, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto',
        });
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mousemove', handleMagneticMove, { passive: true });
    document.addEventListener('mouseleave', handleMagneticLeave);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', handleDocumentLeave);
      document.removeEventListener('mouseenter', handleDocumentEnter);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mousemove', handleMagneticMove);
      document.removeEventListener('mouseleave', handleMagneticLeave);
    };
  }, []);

  const className = [
    'cursor',
    isVisible ? 'is-visible' : '',
    cursorState.hovering ? 'is-hovering' : '',
    cursorState.label ? 'has-label' : '',
    cursorState.type ? `cursor--${cursorState.type}` : '',
    isPressed ? 'is-pressed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
    >
      <div ref={ringRef} className="cursor__ring">
        <div className="cursor__glass-specular" />
      </div>
      <div ref={dotRef} className="cursor__dot" />
      <div ref={labelRef} className="cursor__label">
        {cursorState.label}
      </div>
    </div>
  );
}
