// Saves the OpenAPI spec of srtomy-api into the repo, pretty-printed so that
// changes to the API show up as readable diffs. API_DOCS_URL defaults to the
// local API; API_DOCS_TOKEN is sent as a bearer token when it is set.
import { writeFile } from "node:fs/promises";

const url = process.env.API_DOCS_URL ?? "http://localhost:8080/v3/api-docs";
const token = process.env.API_DOCS_TOKEN;

let response;
try {
  response = await fetch(url, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
} catch {
  process.stderr.write(`No hay respuesta de ${url}. ¿Está corriendo la API?\n`);
  process.exit(1);
}

if (!response.ok) {
  process.stderr.write(`No se pudo descargar ${url}: ${response.status}\n`);
  process.exit(1);
}

const spec = JSON.stringify(await response.json(), null, 2) + "\n";
await writeFile(
  new URL("../app/(api)/openapi/srtomy-api.json", import.meta.url),
  spec,
);
process.stdout.write(`Especificación guardada desde ${url}\n`);
