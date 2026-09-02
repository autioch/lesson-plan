// @ts-check
import { defineConfig } from "astro/config";
import { BASE_PATH } from "./src/site.mjs";

// The site is published to GitHub Pages under a project subpath, so asset URLs
// must carry it: without `base`, /_astro/... 404s at autioch.github.io/lesson-plan/.
// https://astro.build/config
export default defineConfig({
  site: "https://autioch.github.io",
  base: BASE_PATH,
});
