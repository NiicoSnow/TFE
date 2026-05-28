import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const appBase = '/projets/TFE/'

export default defineConfig({
  base: appBase,
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `$app-base: '${appBase}';`,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
