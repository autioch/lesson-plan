/* The GitHub Pages project subpath, in one place: `astro.config.mjs` feeds it
 * to the build so bundled assets carry it, and the layouts prefix the few
 * hand-written asset URLs with it.
 *
 * Astro's own `import.meta.env.BASE_URL` would be the idiomatic source, but it
 * fails to compile inside `.astro` frontmatter on Astro 5.13 here.
 */
export const BASE_PATH = "/lesson-plan";

/** Join the base path with a public/ asset, e.g. asset("favicon.svg"). */
export function asset(name) {
  return BASE_PATH + "/" + name;
}
