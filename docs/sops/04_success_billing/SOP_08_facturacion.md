# SOP-008: Facturación, Cobros y Bajas (Churn)

**ID del Proceso:** QSS-SOP-008 | **Versión:** 1.0 
**Dueño del Proceso (Owner):** Finance / Operations

## 1. Propósito y Alcance
Asegurar la recolección automática de los honorarios de la agencia, mitigar el impacto de pagos fallidos (Dunning) y gestionar las cancelaciones protegiendo la propiedad intelectual (IP) de QSS.

## 2. Matriz RACI
- **Responsible (Ejecuta):** Finanzas / Automatización
- **Accountable (Aprueba/Dueño):** COO (Director de Operaciones)
- **Consulted (Consulta):** Customer Success Manager
- **Informed (Se Informa):** Cliente

## 3. Inputs & Outputs
- **Inputs:** Fecha de facturación recurrente o solicitud de cancelación del cliente.
- **Outputs:** Cobro procesado o infraestructura desconectada limpiamente.

## 4. Herramientas y Seguridad
- **Software:** Stripe / MercadoPago, Make, Google Ads MCC.
- **Seguridad:** Los datos bancarios y registros de disputas solo pueden ser manejados por directivos.

## 5. Checklist de Ejecución (Paso a Paso)
### Protocolo de Dunning (Pagos Fallidos)
- [ ] **Día 1:** Correo automático (vía Stripe) notificando error de tarjeta.
- [ ] **Día 3:** Fin del *Grace Period*. Automatización apaga las campañas de Google Ads.
- [ ] **Día 5:** Desactivar Webhook del bot IA temporalmente.

### Offboarding (Cancelación Definitiva)
- [ ] Desconectar los Webhooks de Ycloud.
- [ ] Revocar el acceso de nuestra Agencia (MCC) a la cuenta de Google Ads del cliente (El cliente conserva sus datos y su número de WhatsApp por ser propietario, pero pierde la IA y Landing Page).
- [ ] Eliminar la Landing Page del despliegue en Vercel.

## 6. Contingencias y Troubleshooting
- **Chargeback / Disputa Bancaria:** Si un cliente en offboarding intenta revertir el cargo por el *Setup Fee* en su tarjeta de crédito:
  1. No contactar al cliente (es contraproducente).
  2. Proveer a Stripe inmediatamente los registros de los leads generados, los logs de los webhooks y las grabaciones del Onboarding Meet como evidencia de que el servicio tecnológico fue entregado y operó correctamente.
