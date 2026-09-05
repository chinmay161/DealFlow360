import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/modules/rule-engine/**"],
      exclude: ["src/modules/rule-engine/__tests__/**"],
    },
  },
});
