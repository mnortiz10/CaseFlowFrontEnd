/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,scss}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A5F",
          dark: "#152D4A",
          light: "#2D5FA8"
        },
        accent: "#2D7DD2",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8F9FA",
          subtle: "#F1F3F5"
        }
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "8px"
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)",
        elevated: "0 4px 16px 0 rgba(0,0,0,.12)"
      }
    }
  },
  plugins: []
};
