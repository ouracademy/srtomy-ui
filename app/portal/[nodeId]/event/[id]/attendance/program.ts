// What the confirmation to delete an event says: deleting an event that has a
// program takes its sub-events with it, and whoever signed up is told by email.
export const deleteMessage = (subEvents: number): string => {
  const base =
    "Se avisará por correo a quienes estén inscritos. Recuerda que una vez eliminado no podrás recuperarlo";
  if (subEvents === 0) return base;
  const what =
    subEvents === 1 ? "su sub-evento" : `sus ${subEvents} sub-eventos`;
  return `También se eliminará ${what}. ${base}`;
};
