import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/modules/rule-engine/**",
        "src/modules/decision-trace/**",
      ],
      exclude: [
        "src/modules/rule-engine/__tests__/**",
        "src/modules/decision-trace/__tests__/**",
      ],
    },
  },
});
