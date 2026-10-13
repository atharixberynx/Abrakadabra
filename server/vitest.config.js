import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // La primera vez se descarga MongoDB para la base de datos en memoria
    hookTimeout: 180_000,
    testTimeout: 20_000,
    // Valores ficticios solo para pruebas: nunca se conectan a Atlas
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/abrakadabra-test-unused',
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret-0001',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret-01',
      CLIENT_URL: 'http://localhost:5173',
    },
  },
});
