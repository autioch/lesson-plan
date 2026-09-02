/**
 * Color contrast utilities
 * Determine appropriate text color (dark or light) based on background luminance
 */

/**
 * Parse hex color to RGB
 * @param hex Hex color string (#RRGGBB)
 * @returns Object with r, g, b values (0-255)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 255, g: 255, b: 255 }; // Default to white if parse fails
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG formula: https://www.w3.org/WAI/WCAG21/Techniques/general/G17
 * @param hex Hex color string
 * @returns Luminance value (0-1)
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // WCAG luminance formula
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if text should be dark or light based on background color
 * Threshold: 0.55 luminance (design requirement from plan: "luminance < 0.55" uses white text)
 * @param backgroundHex Hex color string of background
 * @returns "dark" or "light" text color
 */
export function getTextColor(backgroundHex: string): "dark" | "light" {
  const luminance = getLuminance(backgroundHex);
  // If background is light, use dark text; if dark background, use light text
  return luminance < 0.55 ? "light" : "dark";
}

/**
 * Get CSS color value for text based on background
 * @param backgroundHex Hex color string
 * @returns CSS color value
 */
export function getTextColorCSS(backgroundHex: string): string {
  const textColor = getTextColor(backgroundHex);
  // Assume CSS variables are defined in tokens.css
  return textColor === "light" ? "var(--text-inverse)" : "var(--text-primary)";
}

/**
 * Verify WCAG AA contrast ratio between two colors
 * @param foreground Foreground hex color
 * @param background Background hex color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param foreground Foreground hex color
 * @param background Background hex color
 * @param isLargeText If true, requires 3:1 ratio; if false, requires 4.5:1 ratio
 * @returns true if meets WCAG AA
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = isLargeText ? 3 : 4.5;
  return ratio >= minRatio;
}
