// Reads a Claude Code hook payload from stdin and prints the edited file's
// path relative to the project (argv[2]), with "/" separators. Prints nothing
// when there is no file. Kept in a file, not in `node -e`: on Windows, Git
// Bash drops backslashes from inline scripts passed to node.exe.
const projectDir = process.argv[2] ?? process.cwd();

const normalise = (path) =>
  path
    .replaceAll("\\", "/")
    .replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`);

let data = "";
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  let file = "";
  try {
    const input = JSON.parse(data).tool_input ?? {};
    file = input.file_path ?? input.path ?? "";
  } catch {
    file = "";
  }
  if (!file) return;
  const root = `${normalise(projectDir).replace(/\/+$/, "")}/`;
  const target = normalise(file);
  process.stdout.write(
    target.startsWith(root) ? target.slice(root.length) : target,
  );
});
