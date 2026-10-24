// Auth0 brings the user back to /portal after signing in. A page that needs
// them elsewhere (an invitation link) passes the path it wants in `appState`;
// only paths of this site are followed, never an address someone else wrote.
export const returnToFrom = (appState?: { returnTo?: unknown }): string => {
  const path = appState?.returnTo;
  if (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  ) {
    return path;
  }
  return "/portal";
};
