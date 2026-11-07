# Feature Specification: Eventos compuestos (UI)

**Feature Branch**: `ccr-5c538956-covxf8`

**Created**: 2026-10-31

**Status**: Implementado. Contrato y reglas: spec del API (`srtomy-api/specs/012-composite-events/`).

**Input**: Una iglesia tiene cada año un mega evento de varios días con eventos cortos y cursos dentro. Hasta ahora un evento duraba un solo día y no podía contener otros.

## Decisiones

1. **La fecha de fin va siempre visible.** El formulario muestra «Fecha» y «Hasta» una junto a la otra; no hay interruptor. Un evento dura varios días cuando «Hasta» cae en otro día. «Hasta» sigue a «Fecha» mientras el evento es de un día y nunca queda antes. Un evento de varios días no se repite (la repetición se oculta).
2. **El formulario junta el día y las horas** (`eventRange`). Los selectores de hora traen el día en que se abrieron, así que antes cambiar «Fecha» al crear no movía el evento.
3. **Crear cualquier evento lleva a su pantalla** (`/portal/{nodeId}/event/{id}/attendance`). Desde ahí se arma el programa si se quiere.
4. **El programa es opcional.** La pantalla de un evento que no se repite tiene la sección «Programa»: sus sub-eventos por día (con enlace, horario, Evento/Curso y cómo se entra) y «Agregar sub-evento» (con `events.write`). Un sub-evento queda dentro de las fechas del evento, no se repite y elige su inscripción: **la del evento** (por defecto), **propia** o **sin inscripción**. La configuración de la inscripción propia se pide en el mismo diálogo (con `registrations.configure`).
5. **Un sub-evento dice de qué evento forma parte** («Parte de «…»», con enlace), y su panel de inscripción solo aparece si tiene la propia. Su formulario de edición limita las fechas al evento y deja cambiar cómo se inscribe.
6. **Calendario.** Un evento de más de 24 horas se dibuja como banda en la fila «Varios días» (una vigilia de 22:00 a 06:00 mantiene sus horas). Se puede elegir más de un día arrastrando o en esa fila. Los sub-eventos llevan «Título · Evento» y borde punteado.
7. **Borrar un evento con programa avisa** que sus sub-eventos se eliminan con él.
8. **Página pública** (`/e/{slug}`): el evento con programa lista sus sub-eventos («Incluido en tu inscripción», «Con inscripción aparte», «Sin inscripción»); un sub-evento enlaza a su evento y, si hereda, dice que se inscriba allá. Un evento que cruza días dice ambos («Del … al …»).
9. **Mi espacio**: un sub-evento que entra con el lugar de un mega evento dice «Parte de «…»» y avisa que cancelar la inscripción la quita de todo el evento y sus sub-eventos.

## Fuera de alcance

Mover un sub-evento a otro evento, mover un mega evento con todos sus sub-eventos de una vez, más de un nivel, repetir un evento compuesto (`docs/redesign.md` §10).
