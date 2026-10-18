'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

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
      {/* Trailing 2x2 brick seen from above, slightly isometric. */}
      <div ref={ringRef} className="cursor__brick">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="2" y="6" width="36" height="32" rx="4" fill="var(--cursor-brick-shade)" />
          <rect x="2" y="2" width="36" height="32" rx="4" fill="var(--cursor-brick)" />
          <rect x="3.5" y="3.5" width="33" height="2" rx="1" fill="#fff" opacity="0.35" />
          {[
            [12, 12],
            [28, 12],
            [12, 25],
            [28, 25],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx + 0.8} cy={cy + 1.6} r="5.6" fill="var(--cursor-brick-shade)" />
              <circle cx={cx} cy={cy} r="5.6" fill="var(--cursor-brick)" />
              <circle cx={cx - 1.6} cy={cy - 1.8} r="2" fill="#fff" opacity="0.45" />
            </g>
          ))}
        </svg>
      </div>
      {/* Precise pointer: a single stud. */}
      <div ref={dotRef} className="cursor__stud" />
      <div ref={labelRef} className="cursor__label">
        {cursorState.label}
      </div>
    </div>
  );
}
