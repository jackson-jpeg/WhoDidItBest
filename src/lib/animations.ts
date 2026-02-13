import type { Transition, Variants } from "framer-motion";

export const barFillTransition: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 14,
};

export const stampTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 15,
};

export const resultContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const resultBarVariants: Variants = {
  hidden: {
    width: "0%",
    opacity: 0,
  },
  visible: (percentage: number) => ({
    width: `${percentage}%`,
    opacity: 1,
    transition: barFillTransition,
  }),
};

export const stampVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotate: -6,
    opacity: 1,
    transition: stampTransition,
  },
};

export const nextLinkVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 1.2,
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const countUpTransition: Transition = {
  duration: 0.8,
  ease: "easeOut",
};
