const { hairlineWidth } = require("nativewind/theme");

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#E15033",
          dark: "#C73E22",
          light: "#FCEEE9",
        },
        text: {
          primary: "#0A0A0A",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
        },
        bg: {
          primary: "#FFFFFF",
          secondary: "#F9F9F9",
          tertiary: "#F3F4F6",
        },
        border: {
          default: "#E8E8E8",
          light: "#F3F4F6",
        },
        status: {
          success: "#10B981",
          error: "#EF4444",
          warning: "#F59E0B",
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};
