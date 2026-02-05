// Brand Configuration File
// The Black Hole - Raiders inspired black, white, and silver/gray theme
// Modify this file to customize the app's appearance

export const brandConfig = {
  // Brand Identity
  name: "The Black Hole",
  tagline: "Raider Nation's Most Dedicated Family",

  // Core Color Palette - Black, White, Silver/Gray (Raiders theme)
  colors: {
    // Background colors (pure blacks)
    background: {
      darkest: "#000000",   // Pure black - App background
      dark: "#0a0a0a",      // Near black - Panels, modals
      card: "#141414",      // Dark gray - Card backgrounds
      hover: "#1f1f1f",     // Hover states
      muted: "#2a2a2a",     // Secondary elements
    },

    // Primary accent color (silver/metallic)
    accent: {
      primary: "#A5ACAF",   // Raiders silver
      light: "#C4CDD1",     // Lighter silver
      dark: "#7A8185",      // Darker silver
      glow: "rgba(165, 172, 175, 0.3)",
    },

    // Surface colors (glass effect with silver tint)
    surface: {
      default: "rgba(255, 255, 255, 0.03)",
      hover: "rgba(255, 255, 255, 0.06)",
      border: "rgba(255, 255, 255, 0.1)",
      borderLight: "rgba(165, 172, 175, 0.1)",
      borderMedium: "rgba(165, 172, 175, 0.2)",
      borderStrong: "rgba(165, 172, 175, 0.3)",
    },

    // Text colors
    text: {
      primary: "#ffffff",     // Pure white
      secondary: "#A5ACAF",   // Silver
      muted: "#6b6b6b",       // Gray
    },

    // Status colors
    status: {
      success: "#22c55e",     // Green
      successLight: "#4ade80",
      error: "#ef4444",       // Red
      warning: "#f59e0b",     // Amber
      warningLight: "#fbbf24",
      info: "#3b82f6",        // Blue
    },

    // Navigation specific (silver/black theme)
    nav: {
      pillBackground: "linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)",
      pillBorder: "rgba(165, 172, 175, 0.2)",
      activeBackground: "#A5ACAF",
      activeText: "#000000",
    },
  },

  // 3D Effect Gradients (black/gray theme)
  gradients: {
    card: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
    navPill: "linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)",
    fab: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    header: "linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 100%)",
  },

  // Box Shadows (subtle with silver highlights)
  shadows: {
    card: `
      0 2px 8px rgba(0, 0, 0, 0.6),
      0 8px 24px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.05)
    `,
    navPill: `
      0 2px 8px rgba(0, 0, 0, 0.5),
      0 8px 24px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.08)
    `,
    glow: "0 0 40px rgba(165, 172, 175, 0.15)",
    hover: `
      0 8px 40px rgba(0, 0, 0, 0.5),
      0 0 30px rgba(165, 172, 175, 0.1)
    `,
  },

  // Animation Timings
  animations: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    spring: {
      damping: 25,
      stiffness: 200,
    },
  },

  // Border Radius
  radius: {
    sm: "8px",
    md: "12px",
    lg: "20px",
    xl: "24px",
    full: "9999px",
  },

  // Blur Values
  blur: {
    sm: "8px",
    md: "12px",
    lg: "24px",
    xl: "40px",
  },

  // Typography
  fonts: {
    heading: '"Oswald", sans-serif',
    body: '"Open Sans", sans-serif',
  },
};

export default brandConfig;
