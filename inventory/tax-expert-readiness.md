# Tax Expert V11 — readiness verificable

Fecha de corte: 2026-09-09
Veredicto: **BLOCK para declarar apertura de país solo por Control Plane**
Estado del experto: `candidate`

## Capacidad demostrada

El motor existente tiene una base seria y reutilizable:

- `TaxCalculationService` orquesta códigos adjuntos y por eje, sustituciones, nexus, sourcing, cálculo incluido/excluido, pases compound y no-compound, redondeo y construcción de múltiples legs.
- `TaxCode` fija versión de behavior y vigencia histórica.
- `CountryTaxPolicyService` publica versiones inmutables de política.
- existen contratos para behaviors, asignaciones, sustituciones, brackets, nexus, jurisdicción y resolución de tasas;
- la suite `Ubp.Tax.Tests` compiló y ejecutó **338 pruebas: 338 aprobadas, 0 fallidas, 0 omitidas**.

Comando reproducible:

```sh
dotnet restore ubp-tax-service/tests/Ubp.Tax.Tests/Ubp.Tax.Tests.csproj
dotnet test ubp-tax-service/tests/Ubp.Tax.Tests/Ubp.Tax.Tests.csproj --no-restore --nologo --verbosity minimal
```

## Brechas de soberanía verificadas

1. `DefaultCountryBaselineProfiles` conserva perfiles nacionales compilados.
2. `CountryTaxTemplateSeeder` entrega parte del contenido fiscal como código.
3. `CountryUvtSeeder` mantiene una unidad fiscal colombiana por seeding del servicio.
4. La reportería fiscal estadounidense permanece especializada en código.
5. El Country Pack todavía no es la única fuente ejecutable y atómica para behaviors, tasas, sourcing, nexus, unidades fiscales, tags y reportes.
6. El ADR reconoce como pendientes determination access sequence, treatments, repartition lines, reporting declarativo y withholding timing.

## Graphify

La auditoría del manifiesto resolvió **7 de 9 seeds**, sin ambigüedades. Las dos ausentes son la policy de soberanía y el market lens, que viven en CAPA Governance y no en el grafo backend auditado. El registro conserva `graphSourceRevision=unverified`, por lo que el readiness gate bloquea aunque las seeds de código resuelvan.

## Condición para READY

Tax podrá avanzar a `active` cuando tenga dueño, suplente y aprobación; el grafo esté fijado y verificado; todas las seeds resuelvan en un grafo combinado; y una prueba reproducible demuestre dos configuraciones nacionales ejecutadas por el mismo motor sin editar código. La eliminación de toda deuda nacional no es requisito para publicar el experto, pero sí para afirmar soberanía completa de apertura de país.

## Gate de cadena completa

El inventario ejecutable vive en `inventory/tax-sovereignty-evidence.json` y se evalúa con `tools/engine-sovereignty-gate.mjs`. Separa diez pruebas de la cadena país → Control Plane → pin de tenant → Tax → Ledger. El corte actual bloquea las diez; la suite amplia de Tax prueba estabilidad del motor, pero no sustituye la prueba de publicación y consumo de dos Country Packs ni la configuración de un país ficticio.

Governance debe mantener el veredicto `BLOCK` hasta que todas las etapas tengan evidencia ejecutada sobre el mismo commit de UBP. El cambio de código que cierre una etapa ocurre en UBP; CAPA Governance solo conserva el contrato, la evidencia y la decisión reproducible.
