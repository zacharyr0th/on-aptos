import { Variants, Transition } from "framer-motion";

/**
 * Shared animation variants and configurations for landing page sections
 */

// Card entrance animations - More subtle
export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Alternative card entrance with less rotation
export const cardEntranceSubtle: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Card entrance from left
export const cardEntranceLeft: Variants = {
  hidden: { opacity: 0, x: -15 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Card entrance from left (stronger)
export const cardSlideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Card entrance from right (stronger)
export const cardSlideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Stagger container for multiple items - More subtle
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Stagger container with faster timing
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

// Section header animation - More subtle
export const sectionHeader = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: {
    duration: 0.6,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Alternative section header with different scale
export const sectionHeaderSubtle = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: {
    duration: 0.5,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Fade in from bottom
export const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.6,
    delay: 0.1,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Scale and blur effect - More subtle (removed blur)
export const scaleBlur = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: {
    duration: 0.6,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Slide in from left - More subtle
export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: {
    duration: 0.6,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Slide in from right - More subtle (removed 3D rotation)
export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: {
    duration: 0.6,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Rotate entrance - More subtle (removed 3D rotation)
export const rotateEntrance: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Rotate scale - More subtle (removed rotation and scale)
export const rotateScale = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: {
    duration: 0.6,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Hero section specific animations - More subtle
export const heroTitle = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.8,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  } as Transition,
};

// Common viewport settings
export const defaultViewport = {
  once: true,
  margin: "-100px",
};

// Common easing curves - More subtle
export const easings = {
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  spring: { type: "spring", stiffness: 60, damping: 20 } as const,
  springFast: { type: "spring", stiffness: 80, damping: 18 } as const,
};
