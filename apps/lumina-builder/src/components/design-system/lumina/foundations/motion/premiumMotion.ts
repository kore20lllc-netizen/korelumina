export const premiumMotion = {
  duration: {
    immediate: "duration-100",
    quick: "duration-150",
    standard: "duration-200",
    deliberate: "duration-300",
    ceremonial: "duration-500",
  },

  easing: {
    standard: "ease-out",
    enter: "ease-out",
    exit: "ease-in",
    spatial: "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
  },

  interaction: {
    lift: [
      "transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out",
      "hover:-translate-y-0.5",
      "motion-reduce:transform-none motion-reduce:transition-none",
    ].join(" "),

    press: [
      "transition-transform duration-100 ease-out",
      "active:translate-y-px active:scale-[0.995]",
      "motion-reduce:transform-none motion-reduce:transition-none",
    ].join(" "),

    focus: [
      "transition-[box-shadow,border-color] duration-150 ease-out",
      "motion-reduce:transition-none",
    ].join(" "),
  },

  presence: {
    fade: [
      "transition-opacity duration-200 ease-out",
      "motion-reduce:transition-none",
    ].join(" "),

    fadeScale: [
      "transition-[opacity,transform] duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
      "motion-reduce:transform-none motion-reduce:transition-none",
    ].join(" "),

    section: [
      "transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
      "motion-reduce:transform-none motion-reduce:transition-none",
    ].join(" "),
  },

  state: {
    pulse: [
      "animate-pulse",
      "motion-reduce:animate-none",
    ].join(" "),

    spin: [
      "animate-spin",
      "motion-reduce:animate-none",
    ].join(" "),

    none: "motion-reduce:animate-none motion-reduce:transition-none motion-reduce:transform-none",
  },
} as const;

export type PremiumMotion =
  typeof premiumMotion;
