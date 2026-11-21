/** Title, subtitle and button of the list of children, by where we are. */
export const childrenLabels = (isChurch: boolean, insideGroup: boolean) => {
  if (isChurch) {
    return {
      title: "Sedes",
      subtitle: "Las sedes de esta iglesia.",
      create: "Agregar sede",
    };
  }
  if (insideGroup) {
    return {
      title: "Grupos",
      subtitle: "Los grupos de este grupo o ministerio.",
      create: "Agregar grupo",
    };
  }
  return {
    title: "Grupos y ministerios",
    subtitle: "Los grupos y ministerios de esta sede.",
    create: "Agregar",
  };
};
