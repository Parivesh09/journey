/**
 * Motion Design System
 * Centralized motion tokens and utilities for consistent animations
 * across the application.
 */

// Motion durations (milliseconds)
export const DURATIONS = {
  micro: 100,
  fast: 150,
  normal: 200,
  moderate: 250,
  slow: 300,
  page: 350,
} as const;

// Easing functions
export const EASING = {
  enter: 'cubic-bezier(0.23, 1, 0.32, 1)',  // ease-out
  exit: 'cubic-bezier(0.32, 0, 0.67, 1)',   // ease-in
  state: 'cubic-bezier(0.77, 0, 0.175, 1)', // ease-in-out
} as const;

// Motion presets for common interactions
export const MOTION = {
  // Button interactions
  button: {
    hover: { duration: DURATIONS.fast, easing: EASING.state },
    active: { duration: DURATIONS.micro, easing: EASING.state },
    focus: { duration: DURATIONS.fast, easing: EASING.state },
  },
  
  // Card interactions
  card: {
    hover: { duration: DURATIONS.moderate, easing: EASING.state },
    press: { duration: DURATIONS.fast, easing: EASING.state },
  },
  
  // Sidebar/navigation
  nav: {
    open: { duration: DURATIONS.moderate, easing: EASING.enter },
    close: { duration: DURATIONS.moderate, easing: EASING.exit },
    item: { duration: DURATIONS.fast, easing: EASING.state },
  },
  
  // Modal/dialog
  modal: {
    enter: { duration: DURATIONS.normal, easing: EASING.enter },
    exit: { duration: DURATIONS.normal, easing: EASING.exit },
    backdrop: { duration: DURATIONS.normal, easing: EASING.state },
  },
  
  // Dropdown/popover
  dropdown: {
    enter: { duration: DURATIONS.fast, easing: EASING.enter },
    exit: { duration: DURATIONS.fast, easing: EASING.exit },
  },
  
  // Page transitions
  page: {
    enter: { duration: DURATIONS.page, easing: EASING.enter },
    exit: { duration: DURATIONS.normal, easing: EASING.exit },
  },
  
  // Timer
  timer: {
    update: { duration: DURATIONS.normal, easing: EASING.state },
    progress: { duration: 2000, easing: 'linear' },
  },
  
  // Task interactions
  task: {
    status: { duration: DURATIONS.normal, easing: EASING.state },
    complete: { duration: DURATIONS.normal, easing: EASING.enter },
    remove: { duration: DURATIONS.normal, easing: EASING.exit },
  },
  
  // Progress indicators
  progress: {
    fill: { duration: DURATIONS.moderate, easing: EASING.enter },
  },
} as const;

// Utility for creating CSS transition strings
export function transition(property = 'all', duration = DURATIONS.normal, easing = EASING.state) {
  return `${property} ${duration}ms ${easing}`;
}

// Utility for creating transform transitions
export function transformTransition(duration = DURATIONS.normal, easing = EASING.state) {
  return `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
}

// Check if reduced motion is preferred
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Get motion config with reduced motion support
export function getMotionConfig(preset: keyof typeof MOTION, type?: string) {
  if (prefersReducedMotion()) {
    return { duration: 0, easing: 'linear' };
  }
  
  const config = MOTION[preset];
  return type ? config[type as keyof typeof config] : config;
}
