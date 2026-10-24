export const getLabel = (column: string) => {
  return (
    {
      VISITOR: "Visitante",
      MEMBERSHIP_IN_PROGRESS: "En progreso de ser miembro",
      MEMBER: "Miembro",
    }[column] || "-"
  );
};
