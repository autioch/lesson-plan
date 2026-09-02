import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import * as astroParser from "astro-eslint-parser";

export default defineConfig([
  {
    // Claude Design snapshot: a verbatim mirror of the design project, not our
    // code. Build output and Astro's generated types are not ours either.
    // npm's lockfile legitimately uses "" as the root package key, which
    // json/no-empty-keys flags; it is generated, not ours to lint.
    ignores: ["designs/**", "dist/**", ".astro/**", "package-lock.json"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
  tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      // Design tokens live in one central token layer (src/assets/tokens.css)
      // and are consumed via var(--token) from every other CSS file.
      // no-invalid-properties resolves var() references within a single file,
      // so cross-file token use would otherwise error. allowUnknownVariables
      // turns off that undefined-variable check — the single-source-of-truth
      // token model, not a per-file re-declare.
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
      // The baseline floor is "modern desktop browsers" (CLAUDE.md), not the
      // widely-available set — `newly` still catches genuinely experimental
      // CSS while allowing what the design already ships.
      "css/use-baseline": ["error", { available: "newly" }],
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
]);
