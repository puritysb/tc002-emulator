import { defineConfig } from 'vite';

export default defineConfig({
    base: '/tc002-emulator/',
    server: {
        port: 54200,
        strictPort: true
    }
});
