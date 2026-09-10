# Autoridad PO de CAPA Governance

CAPA Governance emite una decisión de producto solo después de cruzar cuatro planos: autoridad del Domain Expert, anclas verificadas contra una revisión UBP, evidencia ejecutable de las políticas aplicables y suficiencia del contexto para la acción solicitada.

## Decisiones

- `GO`: la capacidad tiene autoridad activa, evidencia vigente, contexto suficiente y ninguna restricción aplicable.
- `NEEDS_EVIDENCE`: la dirección de producto existe, pero falta recuperar evidencia mediante Graphify o fuente autorizada.
- `ESCALATE`: la decisión cruza dominios, tiene riesgo declarado o agotó la recuperación permitida; se entregan los destinos de handoff.
- `BLOCK`: falta autoridad, existe drift, una prohibición aplica, falta aprobación o la política técnica no está demostrada.

Toda respuesta incluye experto primario, mejor versión del producto, resultados esperados, invariantes, prohibiciones, límites de aprobación, gates requeridos y revisiones que sustentan el dictamen. La respuesta orienta y gobierna el trabajo; no ejecuta despliegues ni sustituye permisos runtime.

## Flujo

```text
intención normalizada
  -> integridad del catálogo PO
  -> autoridad y evidencia del dominio
  -> restricciones, riesgo y suficiencia
  -> GO | NEEDS_EVIDENCE | ESCALATE | BLOCK
```

Uso reproducible:

```sh
npm run decide:po -- examples/tax.po-request.json
```

Tax es el primer dominio habilitado. Los dominios candidatos devuelven `BLOCK` con razones concretas hasta publicar manifiesto, resolver semillas, activar autoridad y satisfacer sus gates técnicos.
