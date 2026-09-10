# Inventory Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP ni una política contable aplicable a una jurisdicción concreta.

## Patrones observados

- SAP conecta cada tipo de movimiento con efectos de cantidad, valor, reversa y agrupación contable.
- Dynamics trata FIFO, promedio ponderado y costo estándar como ciclos completos: settlement, cierre, ajustes y variaciones, no solamente fórmulas.
- Odoo conserva valor en el movimiento, distingue AVCO/FIFO/estándar y separa valuación operativa de reconocimiento contable.
- Epicor lleva inventario a bins, lotes, recepción, conteo, WIP y operación móvil, mostrando que un núcleo común debe servir varias industrias.

## Decisiones UBP

1. `StockMovement` es append-only, idempotente y conserva el snapshot de política y costo aplicado.
2. La política de costeo se resuelve por entidad y ubicación con vigencia. AVG y FIFO son estrategias demostradas; cada método adicional debe probar su ciclo completo.
3. Inventario posee cantidades, capas y hechos de costo. Ledger posee el asiento y las cuentas concretas.
4. Reservar reduce ATP, pero no mueve cantidad ni consume costo.
5. Ajustes, revaluaciones y write-downs agregan hechos auditables; nunca reemplazan silenciosamente el historial.
6. Obsolescencia y deterioro de inventario conservan cantidad y costo original. No son depreciación.
7. La capitalización transfiere el bien a Fixed Assets; desde ese momento la depreciación pertenece al subledger de activos.
8. Métodos, alcance, landed cost, tolerancias, política NRV y roles contables viven versionados en Control Plane.

## Capacidades demostradas y brechas

- Demostrado: AVG, FIFO, política versionada, capas FIFO, recepción costeada y valuación básica.
- Bloqueado hasta evidencia E2E: estándar/roll-up, landed cost, PPV, costeo real periódico, backdating, aging, obsolescencia, NRV/write-down y conciliación completa Inventario–GL.

## Fuentes oficiales

- SAP Movement Types: https://learning.sap.com/courses/inventory-management-and-physical-inventory-in-sap-s-4hana/setting-up-movement-types-1
- Dynamics Inventory Costing FAQ: https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/inventory-costing-faq
- Epicor Warehouse Management: https://www.epicor.com/en/products/enterprise-resource-planning-erp/epicor-kinetic/supply-chain-management/ptw-warehouse/
- Odoo Valuation of Stock Movements: https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/inventory_valuation/operations_valuation.html
