module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accentPrimary: 'var(--accent-primary)',
        accentSecondary: 'var(--accent-secondary)',
        contrastOne: 'var(--dark-one)',
        contrastTwo: 'var(--dark-two)',
      },
    },
  },
  plugins: [],
};
