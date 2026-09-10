# Audit & Integrity Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP.

## Patrones observados

- SAP mantiene audit trails consultables sobre acciones gobernadas y restringe su lectura mediante privilegios específicos. UBP necesita hechos funcionales atribuibles, consulta read-only y una política de retención separada de la captura.
- Dynamics 365 permite registrar cambios sensibles de tablas y campos, y trata la segregación de funciones como reglas entre duties con severidad, riesgo y mitigación. UBP debe distinguir mutación técnica, hecho funcional y conflicto de funciones.
- Dynamics advierte que crear una regla SoD no valida automáticamente asignaciones existentes. UBP debe ejecutar conformance después de cada cambio de roles o política.

## Decisiones UBP

1. `AuditChange` es un contrato funcional común; cada bounded context persiste sus hechos dentro de su propia transacción.
2. Posteo, AuditChange y Outbox deben confirmarse atómicamente donde corresponda.
3. Una reversa contable se registra como acción atribuida; no se disfraza como edición del asiento.
4. Periodos cerrados o bloqueados se validan en el dominio de posteo, incluso para llamadas directas o consumidores asíncronos.
5. SoD se ancla a personas reales y se revalida sobre asignaciones existentes.
6. Append-only de aplicación no equivale a almacenamiento WORM; retención e inmutabilidad física son autoridad de plataforma y compliance.

## Fuentes oficiales

- SAP HANA Audit Trail: https://help.sap.com/docs/HANA_CLOUD_DATABASE/c82f8d6a84c147f8b78bf6416dae7290/db560e7bbb57101490d4a1364440077f.html
- Dynamics database logging: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/sysadmin/configure-manage-database-log
- Dynamics segregation of duties: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/sysadmin/set-up-segregation-duties
