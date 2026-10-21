## Qué cambia y por qué

<!-- Qué problema resuelve este PR, en una o dos frases. Enlaza el issue si existe. -->

## Cómo se probó

- [ ] `pnpm check:fast` pasa (tipos, lint, formato, pruebas unitarias)
- [ ] `pnpm test:e2e` pasa, si toca flujos de usuario
- [ ] Probado a mano en el navegador, si toca la interfaz

<!-- Para cambios visuales, agrega capturas de antes y después. -->

## Revisión

- [ ] El título sigue Conventional Commits (`tipo: asunto` en minúsculas)
- [ ] Textos de la interfaz en español; identificadores y comentarios en inglés
- [ ] Las llamadas nuevas a la API están en `app/(api)/services` y tienen prueba
- [ ] Hay estados de carga y de error donde se leen datos
- [ ] No hay secretos, `console.log` ni código comentado
- [ ] Documentación actualizada (`README.md` o `docs/architecture.md`) si cambia algo de lo que cuentan
