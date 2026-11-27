const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  // Uygulamadaki "@/..." yol takma adı (tsconfig paths) testlerde de çalışsın
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: {
    ...tsJestTransformCfg,
  },
};