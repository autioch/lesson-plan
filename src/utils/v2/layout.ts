/**
 * Responsive layout detection and helpers
 */

export type LayoutType = "portrait" | "landscape" | "desktop";

/**
 * Determine layout type based on viewport width and orientation
 * @param width Viewport width in pixels
 * @param isPortrait Whether device is in portrait orientation
 * @returns Layout type: "portrait" | "landscape" | "desktop"
 */
export function getLayout(width: number, isPortrait: boolean): LayoutType {
  if (width >= 1024) {
    return "desktop";
  }
  if (isPortrait) {
    return "portrait";
  }
  return "landscape";
}

/**
 * Determine which days should be visible in current layout
 * @param layout Current layout type
 * @returns Array of day indices to show (0-4 for Mon-Fri)
 */
export function getVisibleDays(layout: LayoutType): number[] {
  if (layout === "portrait") {
    return [0]; // Single day, controlled by selectedDayIndex in JS
  }
  return [0, 1, 2, 3, 4]; // All 5 days
}

/**
 * Get number of time slots to display
 * Used to optimize grid rendering in print
 * @returns Number of slots (11 for full week, may vary per day)
 */
export function getTimeSlotCount(): number {
  return 11; // 07:30 - 16:45
}

/**
 * Get viewport orientation from CSS media query
 * Helper for determining portrait/landscape without JavaScript
 * @returns CSS media query string
 */
export const PORTRAIT_MEDIA = "(orientation: portrait)";
export const LANDSCAPE_MEDIA =
  "(orientation: landscape) and (max-width: 1023px)";
export const DESKTOP_MEDIA = "(min-width: 1024px)";
