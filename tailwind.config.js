const colors = require('tailwindcss/colors')
module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  prefix: 'vida-webrtc-widget-', // Add this line
  theme: {
    extend: {
      colors: {
        ...colors  
      }      
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
