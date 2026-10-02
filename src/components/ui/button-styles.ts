/** Plain module (no "use client") so server components can use the styles too. */
const base =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const buttonStyles = {
  primary: `${base} bg-gold text-on-gold hover:bg-gold-dark`,
  secondary: `${base} border-2 border-line bg-transparent text-fg hover:border-gold hover:text-gold`,
  ghost: `${base} text-fg hover:text-gold`,
} as const;

export type ButtonVariant = keyof typeof buttonStyles;
