---
name: api-submit-button
description: Usar siempre que crees o cambies un formulario, diálogo o botón que llame a la API de srtomy-api (guardar, registrar, enviar, eliminar). Hace que el botón muestre un spinner y quede bloqueado mientras dura la petición.
---

# Botones que llaman a la API

Todo botón que dispara una petición a srtomy-api muestra un **spinner** y queda **deshabilitado** hasta que la petición termina. Así el usuario ve que algo ocurre y no puede enviar dos veces.

## Cuándo aplica

- Un formulario (`FormContainer`) cuyo `onSuccess` o `submit` llama a una función generada (`post*`, `put*`, `delete*`).
- Un botón con `onClick` que llama a la API (por ejemplo «Registrar asistencias»).
- Un diálogo de confirmación cuyo botón de borrado llama a la API.

No aplica a botones que solo navegan, abren un diálogo o cambian un filtro.

## Qué componente usar

- **Guardar** (azul, el estándar del proyecto): `SaveButton` de `app/(components)/SaveButton.tsx`, con la prop `loading`, revise siempre que haya llamadas a la API.
- **Confirmación de borrado**: `DialogDeleteConfirmation` de `app/(components)/`. Su prop `onDelete` debe **devolver la promesa**; el diálogo muestra el spinner solo mientras esa promesa está pendiente.

## Formulario (react-hook-form)

1. El `onSuccess` (o el `submit` que pasa la página) **debe hacer `await`** de la llamada a la API. Si no espera, `isSubmitting` vuelve a `false` antes de tiempo y el spinner no aparece.
2. Pasa el estado del formulario al botón:

   ```tsx
   <SaveButton name="Guardar" loading={formContext.formState.isSubmitting} />
   ```

   `FormContainer` llama a `handleSubmit`, que deja `isSubmitting` en `true` mientras espera a `onSuccess`.

## Botón fuera de un formulario

Usa estado local y `try`/`finally` para que el spinner se apague aunque la petición falle:

```tsx
const [saving, setSaving] = React.useState(false);

<SaveButton
  name="Registrar asistencias"
  loading={saving}
  onClick={async () => {
    setSaving(true);
    try {
      await putEventsByIdAttendance(id, { personIds });
      alert.showMessage("Asistencia guardada exitosamente");
    } finally {
      setSaving(false);
    }
  }}
/>;
```

## Reglas

- **No cambies el texto** del botón a «Guardando…». El spinner reemplaza el texto (`LoadingButton` oculta la etiqueta, que sigue en el DOM para lectores de pantalla).
- **No uses `disabled` a mano** para simular carga: `loading` ya deshabilita el botón.
- **No añadas `useSWRMutation` ni estados globales** solo para esto. Un `useState` o `isSubmitting` basta.
- En un diálogo con petición en curso, **deshabilita «Cancelar»** para no cerrar a mitad de la operación (`DialogDeleteConfirmation` ya lo hace).
- Los textos que ve el usuario van en español.

## Antes de terminar

- [ ] Busca llamadas de escritura en el cambio (`grep -rn "await \(post\|put\|patch\|delete\)" app`) y comprueba que cada una tenga su botón con `loading`.
- [ ] El `await` está dentro del `onSuccess`, `submit` o `onClick`.
- [ ] Si el flujo es nuevo o cambió, la prueba e2e de `tests/` sigue reflejando el botón (el nombre accesible no cambia con el spinner).
- [ ] `pnpm check:fast` en verde.
