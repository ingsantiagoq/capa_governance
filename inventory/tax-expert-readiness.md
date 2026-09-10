# Tax Expert V11 — readiness verificable

Fecha de corte: 2026-09-10

Revisión UBP auditada: `ebf1c845bdf917d821f3182bff0cbe04c21d2c8e`

Veredicto: **READY**

Estado del experto: `active`

## Fundamento de la decisión

Tax opera como motor agnóstico gobernado por políticas ejecutables y versionadas. La evidencia publicada demuestra, sobre una sola revisión UBP:

1. publicación de Country Packs desde Control Plane;
2. resolución única e integridad del manifiesto;
3. pin inmutable de versión por tenant;
4. consumo de esa versión por el motor;
5. upgrade explícito sin reinterpretar operaciones históricas;
6. dos países y un país ficticio sobre el mismo motor;
7. ausencia de fallback nacional en runtime;
8. handoff contable por roles semánticos, con procedencia fiscal, asiento balanceado e idempotencia ante respuesta perdida.

La suite Tax terminó con **345 aprobadas y 0 fallidas**. AR, AP y Ledger verificaron la propagación y persistencia de la procedencia. La integración PostgreSQL AR → Ledger aprobó sus dos recorridos, incluido commit exitoso con pérdida de respuesta y reintento.

## Autoridad

El registro declara `tax-expert` como autoridad activa. Su manifiesto, revisión UBP, grafo combinado y atestación de nueve semillas coinciden. El gate PO exige además que las diez etapas de `inventory/tax-sovereignty-evidence.json` permanezcan en `PASS`.

La decisión vigente se obtiene ejecutando:

```sh
npm run audit:tax-sovereignty
npm run audit:po
```

## Límites

`READY` aplica a la revisión UBP auditada. Un cambio posterior en el motor, Country Packs, contratos o handoff contable exige regenerar el grafo, repetir evidencia y actualizar la atestación. Mientras exista drift, Governance bloquea automáticamente.

Los artefactos nacionales permitidos deben permanecer clasificados como `country-pack-data` o `legal-adapter` detrás de contratos universales. Una regla nacional introducida en el núcleo del motor invalida la soberanía.
