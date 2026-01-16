/**
 * AI Learning Playground - Custom Hooks
 */

/**
 * Hook to get motion props for animations
 */
export function useMotionProps() {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };
}

/**
 * Hook to get transition config for animations
 */
export function useTransition() {
  return { duration: 0.3 };
}
