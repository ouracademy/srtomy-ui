// Copies an address to the clipboard and tells the user how it went. The
// clipboard is not available everywhere (insecure pages, denied permission).
export const copyLink = async (
  url: string,
  notify: (message: string) => void,
) => {
  try {
    await navigator.clipboard.writeText(url);
    notify("Enlace copiado");
  } catch {
    notify("No se pudo copiar. Copie el enlace manualmente");
  }
};
