import {useEffect, useRef} from 'react';

// Observe individual items, never whole product grids or sticky buy boxes.
const REVEAL_TARGETS = [
  '[data-reveal]',
  '.styx-lookbook-grid > a',
  '.styx-categories-grid > a',
  '.styx-weave-grid > a',
  '.styx-ci-families-grid > a',
  '.styx-ci-karat-grid > a',
  '.styx-customize-grid > *',
  '.styx-about-values > *',
  '.styx-tools-grid > *',
  '.styx-gallery-rest > *',
  '.styx-transparency-grid > *',
  '.styx-product-specs-grid > *',
].join(',');

/** One observer per page, including cards that arrive through deferred data. */
export function useReveal<T extends HTMLElement>(pageKey = '') {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!root || motion.matches || !('IntersectionObserver' in window)) return;
    const seen = new WeakSet<HTMLElement>();
    const pending = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.dataset.reveal = 'visible';
          pending.delete(target);
          observer.unobserve(target);
        });
      },
      {threshold: 0.06},
    );

    const register = (target: HTMLElement) => {
      if (seen.has(target) || motion.matches) return;
      seen.add(target);
      // Initial viewport entrances are CSS driven; don't re-hide hydrated content.
      if (target.getBoundingClientRect().top < window.innerHeight) return;
      const siblings = target.parentElement?.children;
      const index = siblings ? Array.from(siblings).indexOf(target) : 0;
      target.style.setProperty('--reveal-delay', `${(index % 4) * 25}ms`);
      target.dataset.reveal = 'pending';
      pending.add(target);
      observer.observe(target);
    };
    const scan = (node: HTMLElement) => {
      if (node.matches(REVEAL_TARGETS)) register(node);
      node.querySelectorAll<HTMLElement>(REVEAL_TARGETS).forEach(register);
    };
    scan(root);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node);
        }),
      );
      pending.forEach((target) => {
        if (root.contains(target)) return;
        observer.unobserve(target);
        pending.delete(target);
      });
    });
    mutations.observe(root, {childList: true, subtree: true});
    const revealAll = () => {
      if (!motion.matches) return;
      observer.disconnect();
      mutations.disconnect();
      pending.forEach((target) => {
        target.dataset.reveal = 'visible';
      });
      pending.clear();
    };
    motion.addEventListener('change', revealAll);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      motion.removeEventListener('change', revealAll);
      pending.forEach((target) => {
        target.dataset.reveal = 'visible';
      });
    };
  }, [pageKey]);

  return ref;
}
