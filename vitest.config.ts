import path from "node:path";

const config = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts"],
    env: {
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5433/sde_command_center?schema=public",
      AUTH_SECRET: "test-secret",
    },
  },
};

export default config;
