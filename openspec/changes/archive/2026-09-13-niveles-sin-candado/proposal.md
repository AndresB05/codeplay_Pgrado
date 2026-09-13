## Why

La lista de niveles de un mundo bloquea todo nivel cuyo anterior no esté
completado, y **nada escribe progreso hasta el J9**: en la práctica sólo se puede
pulsar el nivel 1 de cada mundo. Con el J7.2 sembrando el nivel 2, eso deja un
nivel jugable al que no se llega desde la interfaz.

El usuario lo decidió el 13-sep-2026: **hasta la prueba preliminar, todos los
niveles se pueden pulsar desde la lista**, y cómo funciona el candado se decide
después. Es provisional con fecha, no un cambio de producto definitivo.

## What Changes

- **La lista de niveles deja de bloquear.** Todas las tarjetas se pueden pulsar,
  y ninguna lleva candado, color apagado ni cursor de prohibido.
- **Se conservan «completado» y «Aquí vas»**, que salen del progreso real y no
  impiden entrar. «Aquí vas» pasa a marcar el primer nivel sin completar, que es
  lo que marcaba con el candado puesto cuando no había huecos en el avance.
- **La pantalla de nivel no cambia**: sigue sin comprobar candado, que ahora es
  coherente con la lista en vez de ser un agujero (`docs/CONTEXT.md` §4.11).
- **Los niveles que siguen sembrados en el formato del juego anterior** se
  pueden pulsar y enseñan el rechazo del contrato §7, «Este nivel todavía no se
  puede jugar». Es el mismo camino que hoy se recorre escribiendo la dirección.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `contenido-mundos`: el requisito «Progresión bloqueada por niveles» pasa a
  decir que ningún nivel se bloquea en la lista mientras dure la etapa previa a
  la prueba preliminar.

## Impact

**Base de datos.** Ninguna. No hay migración ni `db push`.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/components/dashboard/student/StudentWorldLevelsModule.tsx` | Fuera la regla del anterior completado, el `disabled`, el candado y el estilo de bloqueado. Se quedan completado y «Aquí vas» |

**Documentación.** `docs/CONTEXT.md` §4.11 —el candado ya no existe en ninguna
parte y se decide tras la prueba preliminar— y la fila correspondiente de §2.6
si la nombra; `openspec/config.yaml` no cambia, porque no toca stack,
estructura, convenciones ni prioridades.

**Lo que NO entra:** decidir el candado definitivo, comprobarlo en la pantalla de
nivel y cualquier cambio en los mundos, que no se bloquean hoy.
