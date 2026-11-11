/** Title and button of the list of children, by where we are. */
export const childrenLabels = (isChurch: boolean, insideGroup: boolean) => {
  if (isChurch) return { title: "Sedes", create: "Agregar sede" };
  if (insideGroup) return { title: "Grupos", create: "Agregar grupo" };
  return { title: "Grupos y ministerios", create: "Agregar" };
};
