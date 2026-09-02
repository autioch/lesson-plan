/**
 * Break duration calculation between consecutive lesson slots
 */

interface TimeSlot {
  start: string; // "HH:MM"
  duration: number; // minutes
}

/**
 * Parse time string "HH:MM" into minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight back to "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calculate break duration between two consecutive slots
 * @param currentSlot Current lesson slot
 * @param nextSlot Following lesson slot
 * @returns Break duration in minutes, or 0 if no break
 */
export function calculateBreak(
  currentSlot: TimeSlot,
  nextSlot: TimeSlot,
): number {
  const currentEnd = timeToMinutes(currentSlot.start) + currentSlot.duration;
  const nextStart = timeToMinutes(nextSlot.start);
  return Math.max(0, nextStart - currentEnd);
}

/**
 * Format break duration for display
 * @param minutes Break duration in minutes
 * @returns Formatted string, e.g., "5 min", "15 min"
 */
export function formatBreak(minutes: number): string {
  if (minutes === 0) return "";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

/**
 * Get end time of a lesson slot
 * @param slot Lesson slot with start time and duration
 * @returns End time as "HH:MM"
 */
export function getSlotEndTime(slot: TimeSlot): string {
  const startMinutes = timeToMinutes(slot.start);
  const endMinutes = startMinutes + slot.duration;
  return minutesToTime(endMinutes);
}

/**
 * Format time slot as range "HH:MM–HH:MM"
 */
export function formatSlotRange(slot: TimeSlot): string {
  return `${slot.start}–${getSlotEndTime(slot)}`;
}
