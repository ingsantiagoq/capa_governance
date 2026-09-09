# Soberanía de motores agnósticos

UBP abre países, industrias y clientes mediante configuración gobernada. Un cambio ordinario de jurisdicción no exige recompilar un motor ni crear un fork por cliente.

## Frontera obligatoria

- **Control Plane gobierna:** publica políticas tipadas, versionadas, con vigencia, hash, procedencia, dependencias y rollback. Los Country Packs deben contener recursos ejecutables, no solo referencias.
- **Los motores ejecutan:** Ledger, Tax, Payroll, Numbering, FX y Fiscal Documents interpretan contratos universales. No deciden tasas, cuentas, fórmulas, calendarios o formatos nacionales mediante condicionales de país en su núcleo.
- **Los dominios aportan hechos:** POS, Inventory, AR, AP, Production y otros emiten hechos e intenciones semánticas; no seleccionan cuentas concretas ni calculan obligaciones legales por su cuenta.
- **Los adaptadores legales aíslan formatos externos:** un renderer, transmisor o conector nacional es válido si implementa una interfaz universal, se selecciona por binding gobernado y no introduce reglas del país en el núcleo.

## Regla de evolución

Agregar un país cambia configuración cuando las primitivas universales existentes pueden expresarlo. El código cambia únicamente cuando aparece una capacidad universal nueva. Esa capacidad debe diseñarse sin nombre de país, probarse con al menos dos configuraciones distintas y publicarse antes del Country Pack que la consume.

## Constitución contable transversal

Todo hecho económico confirmado debe terminar en uno de estos estados verificables:

1. asiento aceptado, balanceado por moneda, trazable a política y versión; o
2. obligación durable de posteo con reintento idempotente, observabilidad y reparación.

No se permite capturar una falla de Ledger y dejar solo una advertencia. Las correcciones usan reversa o ajuste gobernado; nunca mutación silenciosa de historia. Las cuentas concretas provienen de Account Maps vigentes; los dominios operativos usan roles contables.

## Gate READY / BLOCK

Governance responde **BLOCK** ante una nueva regla nacional en código de núcleo, tasa o cuenta embebida, binding nacional sin política versionada, migración usada como único canal de legislación, Country Pack sin contenido ejecutable, o hecho económico sin posteo ni obligación durable.

Responde **READY** solo con manifest válido, autoridad activa, seeds resueltas contra una revisión fijada, configuración versionada y pruebas reproducibles que demuestren el mismo motor con configuraciones distintas.
