import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.{js,ts}',
        '**/vite.config.{ts,js}',
        '**/vitest.config.{ts,js}',
        '**/*.d.ts',
        '**/index.ts', // Barrel exports
        '**/routes.ts', // Route definitions
        '**/bootstrap.ts', // Bootstrap wiring (tested via integration tests)
        '**/*.test.{ts,tsx}',
        '**/testHelpers.ts',
        '**/Mock*.ts',
        '**/*MockData.ts',
        '**/main.ts', // App entry point
        '**/App.vue', // Root component
        '**/HomePage.vue', // Landing page
        // Ports/interfaces (contracts, not implementations)
        '**/*Port.ts',
        // Bootstrap/app wiring (tested via integration)
        '**/app/stores/index.ts',
        // HTTP client implementation (infrastructure, tested via integration)
        '**/common/http/AxiosHttpClient.ts',
        // Time provider implementations (infrastructure)
        '**/common/time/time_provider/BrowserTime.ts',
        '**/common/time/timeout/BrowserTimeout.ts',
        // Repository implementations (tested via integration tests)
        '**/repositories/Http*.ts',
      ],
      include: ['src/**/*.{ts,vue}'],
      thresholds: {
        // Domain layer - should be high coverage
        'src/domains/**/entities/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'src/domains/**/services/**': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/domains/**/store/**': {
          lines: 85,
          functions: 90,
          branches: 75,
          statements: 85,
        },
        'src/domains/**/components/**': {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
        'src/domains/**/pages/**': {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
        },
        // Common layer - domain errors should be tested
        'src/common/errors/**': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        // Overall thresholds (lower to account for infrastructure)
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})