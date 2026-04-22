"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@huelegood/ui";
import { prefersReducedMotion } from "../lib/motion";

export function StorefrontReveal({
  children,
  className,
  selector,
  threshold = 0.18,
  y = 24,
  duration = 0.55,
  stagger = 0.08,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  selector?: string;
  threshold?: number;
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      return;
    }

    let ctx: gsap.Context | null = null;
    let animated = false;

    const animate = () => {
      const targets = selector?.trim().length ? gsap.utils.toArray<HTMLElement>(selector, root) : [root];
      if (targets.length === 0) {
        return;
      }

      ctx = gsap.context(() => {
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y },
          {
            autoAlpha: 1,
            y: 0,
            duration,
            delay,
            stagger: targets.length > 1 ? stagger : 0,
            ease: "power2.out",
            clearProps: "opacity,transform,visibility"
          }
        );
      }, root);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || animated) {
          return;
        }

        animated = true;
        animate();
        observer.disconnect();
      },
      {
        threshold,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      ctx?.revert();
    };
  }, [delay, duration, selector, stagger, threshold, y]);

  return (
    <div ref={rootRef} className={cn(className)}>
      {children}
    </div>
  );
}
