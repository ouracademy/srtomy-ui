// Address that cancels a sign-up with the code its owner kept.
export const cancelRegistrationPath = (slug: string, cancelCode: string) =>
  `/e/${slug}/cancelar/${cancelCode}`;
