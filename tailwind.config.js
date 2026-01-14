/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Apply to all files in app and components
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Very dark grey/black
        primary: '#fafafa',    // Almost white
        secondary: '#71717a',  // Mid-grey
        button: {
            primary: '#fafafa',
            secondary: '#27272a', // Dark grey
        },
      },
      fontFamily: {
        sans: ['Outfit-Regular'],
        medium: ['Outfit-Medium'],
        bold: ['Outfit-Bold'],
      }
    },
  },
  plugins: [],
}
