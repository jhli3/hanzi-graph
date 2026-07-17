import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Project page is served from https://jhli3.github.io/hanzi-graph/
  // so every built asset URL must be prefixed with the repo name.
  base: '/hanzi-graph/',
  plugins: [react()],
})
