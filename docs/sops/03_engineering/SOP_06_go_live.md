# SOP-006: Go-Live & Handoff

**ID del Proceso:** QSS-SOP-006 | **Versión:** 1.0 
**Dueño del Proceso (Owner):** Customer Success Manager

## 1. Propósito y Alcance
Verificar que la infraestructura tecnológica funciona sin fricciones en un entorno de pruebas simulado, encender el tráfico real de Ads y traspasar el control operativo al cliente.

## 2. Matriz RACI
- **Responsible (Ejecuta):** Customer Success Manager
- **Accountable (Aprueba/Dueño):** Head of Operations
- **Consulted (Consulta):** Media Buyer
- **Informed (Se Informa):** Cliente

## 3. Inputs & Outputs
- **Inputs:** Tech Setup finalizado (Aviso de Ingeniería).
- **Outputs:** Campañas consumiendo presupuesto, cliente notificado y equipado con el Kit de Cierre.

## 4. Herramientas y Seguridad
- **Software:** WhatsApp Web, Google Ads, Stripe (Modo Test / Cupones).
- **Seguridad:** Asegurarse de revertir cualquier pago de prueba o usar cupones del 100% para no generar disputas financieras.

## 5. Checklist de Ejecución (Paso a Paso)
### Pruebas End-to-End (Test Lead)
- [ ] El CS ingresa a la Landing Page desplegada.
- [ ] Clic en el CTA y conversación con el Bot IA de WhatsApp.
- [ ] Superar la pre-calificación y realizar un pago simulado (Cupón 100%).
- [ ] **Validación Crítica:** Confirmar con el abogado que le acaba de llegar la "Plantilla de Alerta" a su número personal.

### Handoff al Cliente
- [ ] Enviar correo oficial de "Sistema en Vivo".
- [ ] Adjuntar el **Kit de Cierre Comercial por WhatsApp** (PDF/Video) que enseña al abogado cómo continuar la conversación que inició el Bot.
- [ ] Habilitar y despausar las campañas en Google Ads a presupuesto normal.

## 6. Contingencias y Troubleshooting
- **La Plantilla de Alerta no llega al Abogado:** 
  1. Verificar en el panel de Ycloud si el estado del mensaje es `failed`.
  2. Confirmar que el número personal proveído por el abogado incluye el código de país correcto.
  3. Comprobar logs del backend para asegurar que la solicitud a la API se disparó al confirmar el pago.
