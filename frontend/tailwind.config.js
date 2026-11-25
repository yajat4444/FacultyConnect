/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Derived from user's palette spec
        // Main bg:   #FDFBF7  HSL(40°, 60%, 98%) — warm cream
        // Accent bg: #F7FCFC  HSL(180°, 46%, 98%) — cool mint tint
        // Neutral:   desaturate main 60% → HSL(40°, 24%, 98%) → #FBFAF9
        // Primary:   darken accent ~55% → HSL(180°, 46%, 43%) → #3B9F9F (teal)

        ink: {
          DEFAULT: "#0F2020",   // very dark teal-black
          soft:    "#3A5252",   // medium teal-grey for secondary text
          faint:   "#6B8A8A",   // lighter for hints / labels
        },
        paper: {
          DEFAULT: "#FDFBF7",   // user's main colour — warm cream
          raised:  "#F7FCFC",   // user's accent bg — cool mint tint
        },
        // border separator line
        rule: "#D0E4E4",
        // stronger border for form fields / panels
        edge: "#A8C8C8",
        // subtle tinted wash surface
        wash: "#E4F0F0",
        // High-contrast teal — replaces terracotta as primary action colour
        // HSL(180°, 46%, 43%)
        teal: {
          DEFAULT: "#3B9F9F",
          dark:    "#2C7676",
          light:   "#83C4C4",
        },
        // Keep terracotta alias so existing JSX refs still compile
        terracotta: {
          DEFAULT: "#3B9F9F",
          dark:    "#2C7676",
          light:   "#83C4C4",
        },
        // Accent for open/active badges (olive → muted sage to fit new palette)
        olive: {
          DEFAULT: "#4A7C59",
          light:   "#7DAB8A",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans:    ["'Libre Franklin'", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
      backgroundImage: {
        grain: "url('/grain.svg')",
      },
    },
  },
  plugins: [],
};
