const mongoose = require('mongoose');

/**
 * Returns true if the string is a valid MongoDB ObjectId.
 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Checks whether two availability slot arrays have any overlapping time windows
 * on the same day.
 *
 * @param {Array} slotsA  - User A availability [{day, startTime, endTime}, ...]
 * @param {Array} slotsB  - User B availability
 * @returns {Array}       - Overlapping slots [{day, startTime, endTime}, ...]
 */
const findAvailabilityOverlap = (slotsA, slotsB) => {
  const overlaps = [];

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const fromMinutes = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.day !== b.day) continue;

      const startA = toMinutes(a.startTime);
      const endA   = toMinutes(a.endTime);
      const startB = toMinutes(b.startTime);
      const endB   = toMinutes(b.endTime);

      const overlapStart = Math.max(startA, startB);
      const overlapEnd   = Math.min(endA,   endB);

      if (overlapStart < overlapEnd) {
        overlaps.push({
          day:       a.day,
          startTime: fromMinutes(overlapStart),
          endTime:   fromMinutes(overlapEnd),
        });
      }
    }
  }

  return overlaps;
};

/**
 * Validates that a proposed session datetime falls within an availability overlap.
 *
 * @param {Date}   proposedDate - The proposed session start date/time
 * @param {Number} durationMins - Session duration in minutes
 * @param {Array}  overlaps     - Output of findAvailabilityOverlap()
 * @returns {Boolean}
 */
const isWithinOverlap = (proposedDate, durationMins, overlaps) => {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = DAYS[proposedDate.getDay()];

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const proposedStart = proposedDate.getHours() * 60 + proposedDate.getMinutes();
  const proposedEnd   = proposedStart + durationMins;

  return overlaps.some(
    (slot) =>
      slot.day === dayName &&
      toMinutes(slot.startTime) <= proposedStart &&
      proposedEnd <= toMinutes(slot.endTime)
  );
};

module.exports = { isValidId, findAvailabilityOverlap, isWithinOverlap };
