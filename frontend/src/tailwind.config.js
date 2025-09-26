/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}", 
    ],
    theme: {
      extend: {
        colors: {
          primary: "#2F80ED",
          "primary-dark": "#1C60B3",
          secondary: "#56CCF2",
          "card-bg": "#FFFFFF",
          "text-dark": "#333333",
          "text-light": "#828282",
          danger: "#EB5757",
          success: "#27AE60",
          "background-primary": "#F5F7FA",
        },
      },
    },
    plugins: [],
  };
  