# Context Broker v1

Referencia ejecutable: tools/context-broker.mjs, funcion transition(previous,
facts). Es determinista, sin I/O, modelos, herramientas ni ejecucion de negocio.
El estado inicial es block hasta que haya hechos suficientes. Cada evento
reevalua todos los hechos y puede invalidar un ready anterior.

## Hechos obligatorios

- route: matched, ambiguous o missing; manifestValid: validacion del catalogo.
- policyDenied: una restriccion absoluta aplica a la accion propuesta.
- approvalRequired y approvalGranted: aprobacion verificable de la accion y
  alcance actuales; no una afirmacion del modelo. Sin requisito usar false/false.
- decisionRequired: ambiguedad de producto, handoff arquitectonico, conflicto
  de evidencia o reviewer gate aplicable aun pendiente.
- contextSufficient: evidencia suficiente para la tarea; no mero conteo de campos.
- graphAvailable, graphAttempted, expansions: disponibilidad, intento registrado
  (incluida indisponibilidad) y numero de intentos consumidos.
- maxExpansions: tomar del manifest validado, entre 1 y 3, sin aumentarlo en bucle.
- sourceAllowed: hay referencias precisas y acceso permitido para resolver la
  brecha; sourceAttempted: lectura focalizada ya completada o fallida.

No omitir hechos. Entradas incompletas o inconsistentes bloquean. El consumidor
persiste contadores y evidencias por tarea; no puede reiniciarlos para evadir el
presupuesto. La funcion no autentica esos hechos ni verifica permisos remotos.

## Prioridad de evaluacion

| Orden | Condicion | Estado | Accion |
| --- | --- | --- | --- |
| 1 | Hechos invalidos | block | none |
| 2 | Capacidad ausente o manifest invalido | block | none |
| 3 | Restriccion absoluta | block | none |
| 4 | Aprobacion exigida ausente | block | none |
| 5 | Ruta ambigua o decision pendiente | escalate | handoff |
| 6 | Contexto suficiente | ready | use-pack |
| 7 | Grafo disponible, presupuesto y sin lectura fuente previa | expand | graphify |
| 8 | Grafo intentado, fuente permitida y aun no intentada | expand | source |
| 9 | Recuperacion agotada o no disponible | escalate | handoff |

block prohibe continuar la accion; se informa el motivo. escalate entrega al PO,
arquitecto o reviewer la decision concreta pendiente segun governance. expand
solo recupera evidencia. ready permite continuar dentro de las politicas,
aprobaciones y gates existentes; nunca ejecuta por si mismo.

## Eventos y transiciones

Desde cualquier estado, cambio de intencion, manifest, permisos o evidencia
reevalua la tabla completa. ready puede pasar a block por permiso perdido o a
escalate por nuevo alcance. expand puede pasar a ready al resolver la brecha,
a expand/source tras agotar el grafo, a escalate tras agotar fuente o a block
por restriccion. escalate y block solo se desbloquean con hechos nuevos
(decision resuelta, aprobacion valida, manifest publicado/corregido); reintentar
los mismos hechos conserva el resultado. No hay desbloqueo por tiempo.

La prioridad evita que contextSufficient o approvalGranted anulen restricciones.
Una decision pendiente se escala antes de recuperar mas contexto; si el
responsable requiere evidencia, registra esa necesidad y reevalua con la
decision procedimental resuelta, conservando la prohibicion de ejecutar cambios
hasta completar sus gates. No usar Graphify directamente desde escalate.

Las pruebas ejercitan transiciones, orden de recuperacion, prioridad de bloqueo,
recuperacion agotada y hechos incompletos con node --test.

## Extension v2

El [protocolo de expertos](domain-experts.md) agrega seleccion de un primario
por dominio y capacidad, bloqueos de experto y handoffs por riesgo o cruce.
Las reglas v1 anteriores siguen vigentes; una capacidad ausente bloquea,
un experto ausente para una capacidad valida escala de forma controlada.
