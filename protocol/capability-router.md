# Capability Router v1

El router traduce intencion de negocio a una capacidad publicada, antes de
recuperar detalles tecnicos. No ejecuta llamadas de negocio en esta v1.

1. Cargar el catalogo aprobado en una revision fijada y validarlo.
2. Comparar la intencion normalizada con capability.id e intents. Las variantes
   linguisticas pueden ser propuestas por el adaptador, pero deben quedar
   trazadas a una intencion publicada. No usar coincidencias vagas de archivos.
3. Una coincidencia unica produce matched y un Context Pack. Cero coincidencias
   produce missing y block; varias producen ambiguous y escalate al PO. No
   elegir silenciosamente la primera capacidad ni unir manifests para ocultar
   una ambiguedad. Una tarea cross-service exige evaluar architectHandoff.
4. Evaluar politicas y suficiencia con el broker. Solo ready permite continuar
   con el pack; no otorga permisos adicionales de ejecucion.
5. Solo expand/graphify permite explicar semillas curadas, resolver caminos entre
   ellas o analizar impacto anclado. Registrar revision, brecha y resultados.
   No hacer busqueda libre global. Cada intento, incluso fallido, consume una
   expansion. Un indice ausente cuenta como intento fallido documentado.
6. Reevaluar. Solo expand/source permite abrir referencias precisas derivadas
   del manifest o subgrafo despues de agotar Graphify o documentar indisponibilidad.
   La lectura es acotada a la brecha, nunca un barrido del repo. Si falta una
   referencia resoluble, sourceAllowed=false y escalar al responsable.

Ejemplos: consultar disponibilidad por sucursal resuelve inventory. Previsualizar
capacidades de un plan resuelve control-plane. Permitir venta sin stock requiere
PO y arquitectura; activar capacidades en produccion sin aprobacion bloquea.
Las intenciones nuevas requieren publicar o revisar el catalogo, no descubrir
una capacidad no gobernada desde codigo.

Manifest-first publica conocimiento; graphify-second expande relaciones;
source-last comprueba evidencia exacta. Ninguna recuperacion cambia autoridad.
