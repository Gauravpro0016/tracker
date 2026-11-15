"use client";

import gsap from "gsap";

/**
 * Filter any null/undefined targets to guarantee GSAP never encounters null._gsap
 */
function getValidElements(targets: any): HTMLElement[] {
  if (!targets) return [];
  if (Array.isArray(targets)) {
    return targets.filter(
      (el): el is HTMLElement =>
        Boolean(el && typeof el === "object" && "nodeType" in el && el.nodeType === 1)
    );
  }
  if (typeof targets === "object" && "nodeType" in targets && targets.nodeType === 1) {
    return [targets];
  }
  return [];
}

/**
 * Fade and slide in single element or array of elements smoothly with power3 ease
 */
export function gsapFadeIn(
  targets: any,
  options: {
    y?: number;
    x?: number;
    duration?: number;
    delay?: number;
    opacity?: number;
    scale?: number;
  } = {}
) {
  if (typeof window === "undefined") return;
  const elements = getValidElements(targets);
  if (elements.length === 0) return;

  const {
    y = 20,
    x = 0,
    duration = 0.45,
    delay = 0,
    opacity = 1,
    scale = 1,
  } = options;

  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y,
      x,
      scale: scale !== 1 ? 0.97 : 1,
    },
    {
      opacity,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      delay,
      ease: "power3.out",
      clearProps: "transform",
    }
  );
}

/**
 * Stagger child cards or list items smoothly
 */
export function gsapStagger(
  targets: any,
  options: {
    y?: number;
    stagger?: number;
    duration?: number;
    delay?: number;
  } = {}
) {
  if (typeof window === "undefined") return;
  const elements = getValidElements(targets);
  if (elements.length === 0) return;

  const { y = 20, stagger = 0.05, duration = 0.4, delay = 0 } = options;

  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y,
      scale: 0.98,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      delay,
      stagger,
      ease: "power2.out",
      clearProps: "transform",
    }
  );
}

/**
 * Subtle magnetic hover attraction on buttons
 */
export function gsapMagnetic(e: React.MouseEvent<HTMLElement>, intensity = 0.25) {
  if (typeof window === "undefined" || !e || !e.currentTarget) return;
  const target = e.currentTarget;
  if (!target || typeof target.getBoundingClientRect !== "function") return;

  const rect = target.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) * intensity;
  const y = (e.clientY - rect.top - rect.height / 2) * intensity;

  gsap.to(target, {
    x,
    y,
    duration: 0.3,
    ease: "power2.out",
  });
}

export function gsapResetMagnetic(e: React.MouseEvent<HTMLElement>) {
  if (typeof window === "undefined" || !e || !e.currentTarget) return;
  gsap.to(e.currentTarget, {
    x: 0,
    y: 0,
    duration: 0.4,
    ease: "elastic.out(1, 0.4)",
  });
}

/**
 * Smooth glowing audio wave animation for recording
 */
export function gsapAudioWave(
  bars: any,
  active: boolean
) {
  if (typeof window === "undefined") return;
  const elements = getValidElements(bars);
  if (elements.length === 0) return;

  gsap.killTweensOf(elements);

  if (!active) {
    gsap.to(elements, {
      scaleY: 0.4,
      duration: 0.2,
      ease: "power2.out",
    });
    return;
  }

  elements.forEach((bar, idx) => {
    gsap.to(bar, {
      scaleY: "random(0.3, 1.8)",
      duration: 0.18 + idx * 0.04,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });
}
