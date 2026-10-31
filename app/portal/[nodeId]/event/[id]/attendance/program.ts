// What the confirmation to delete an event says: deleting an event that has a
// program takes its sub-events with it.
export const deleteMessage = (subEvents: number): string => {
  const base = "Recuerda que una vez eliminado no podrás recuperarlo";
  if (subEvents === 0) return base;
  const what =
    subEvents === 1 ? "su sub-evento" : `sus ${subEvents} sub-eventos`;
  return `También se eliminará ${what}. ${base}`;
};
