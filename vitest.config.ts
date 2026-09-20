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
  },
};

export default config;
