import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/.browser-profile/**'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: 'src/test/setup.ts',
    // Lets tokens.test.ts read tokens.css as text to check it mirrors tokens.ts.
    css: { include: [/tokens\.css/] },
  },
});
