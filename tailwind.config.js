/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Добавьте этот путь, чтобы Tailwind сканировал ваши файлы на наличие классов
  ],
  theme: {
    extend: {
      borderWidth: {
        '0.1': '0.1px',
      },
      boxShadow: {
        '3xl': '10px 10px 20px -10px rgba(0, 0, 0, 0.5)',
      },
      inset: {
        '3px': '90px',
      }
    },
  },
  plugins: [],
}
