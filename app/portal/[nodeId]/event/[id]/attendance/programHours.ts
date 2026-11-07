type Span = { start?: Date; end?: Date };

const DEFAULT_FIRST = 7;
const DEFAULT_LAST = 22;

const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`;

// The hours the program calendar shows: from 07:00 to 22:00, wider when a
// session starts earlier or ends later, so none is cut off.
export const visibleHours = (sessions: Span[]) => {
  let first = DEFAULT_FIRST;
  let last = DEFAULT_LAST;
  for (const { start, end } of sessions) {
    if (start) first = Math.min(first, start.getHours());
    if (start && end) {
      const endsAfterMidnight = end.getDate() !== start.getDate();
      const endHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
      last = Math.max(last, endsAfterMidnight ? 24 : endHour);
    }
  }
  return { slotMinTime: clock(first), slotMaxTime: clock(last) };
};
