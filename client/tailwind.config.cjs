/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    screens: {
      'xs': '375px',   // Petits mobiles
      'sm': '640px',   // Tablettes portrait
      'md': '768px',   // Tablettes paysage / petits desktop
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large desktop
    },
    extend: {},
  },
  plugins: [],
} 