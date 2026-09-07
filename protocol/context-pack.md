# Context Pack v1

El pack es una proyeccion fiel del manifest validado con exactamente siete campos:

| Campo | Contenido |
| --- | --- |
| capability | id estable, nombre de negocio e intenciones publicadas |
| services | servicios y bordes implicados |
| contracts | contratos y operaciones publicadas |
| dependencies | dependencias necesarias para interpretar la capacidad |
| restrictions | invariantes obligatorias; una aprobacion no las anula |
| governance | deterministic, poDecision, architectHandoff, reviewerGate y forbiddenWithoutApproval |
| retrieval | orden fijo, semillas curadas, presupuesto y procedencia |

Cada lista debe contener al menos una referencia o politica no vacia. v1 cubre
capacidades UBP con dependencias y contratos; no usa listas vacias como sinonimo
de desconocido. Si falta un campo, el manifest debe corregirse antes de consumo.

La intencion normalizada, revision Git del manifest, revision del indice, tarea,
evidencias, aprobaciones y resultado del broker van en un sobre de ejecucion
separado. No son un octavo campo del pack. Una expansion adjunta evidencias a ese
sobre (semilla, operacion, revision, referencia y brecha resuelta); no reescribe
las politicas oficiales. Si contradice el manifest, detener y escalar su revision.

Suficiente significa que la tarea concreta tiene servicios, contratos,
dependencias y restricciones identificados y las decisiones y gates aplicables
resueltos. Tener siete campos no equivale a suficiencia ni concede autorizacion.
ReviewerGate enumera verificaciones exigidas para cambios; la integracion debe
marcar decisionRequired mientras un gate aplicable siga pendiente. La lectura
ordinaria no dispara automaticamente todos los gates de cambio.
