# SOP-003: Preparación Pre-Onboarding

**ID del Proceso:** QSS-SOP-003 | **Versión:** 1.0 
**Dueño del Proceso (Owner):** Operations Manager

## 1. Propósito y Alcance
Preparar tecnológicamente al cliente antes de la videollamada de Onboarding para evitar retrasos operativos. El alcance inicia con el pago exitoso y termina cuando el cliente asiste al Onboarding Meet con su *Checklist Crítico* listo.

## 2. Matriz RACI
- **Responsible (Ejecuta):** Sistema de Automatización (Zapier/Make)
- **Accountable (Aprueba/Dueño):** Operations Manager
- **Consulted (Consulta):** Customer Success Manager
- **Informed (Se Informa):** Especialista de Onboarding

## 3. Inputs & Outputs
- **Inputs:** Confirmación de pago (Stripe Webhook).
- **Outputs:** Cita de Onboarding agendada y cliente notificado.

## 4. Herramientas y Seguridad
- **Software:** Zapier/Make, Calendly, ActiveCampaign/HubSpot.
- **Seguridad:** Los correos transaccionales deben enviarse desde un dominio autenticado (DMARC/DKIM).

## 5. Checklist de Ejecución (Paso a Paso)
- [ ] El trigger del pago activa el flujo en Make/Zapier.
- [ ] Mover estado del lead en el CRM a "Cliente Activo - Esperando Onboarding".
- [ ] Enviar correo de Bienvenida que incluye:
  - Mensaje de expectativas claras.
  - Enlace de Calendly para agendar la llamada 1-a-1.
  - **Checklist Crítico del Cliente (Innegociable):**
    1. Adquirir una SIM/Chip nuevo.
    2. Tener la Tarjeta de Crédito física a la mano.
    3. Ser Administrador absoluto del Facebook Business Manager de su despacho.
- [ ] Configurar envío de recordatorios 24h y 2h antes de la llamada.

## 6. Contingencias y Troubleshooting
- **El cliente llega a la llamada sin la SIM o sin acceso de Administrador:** El Especialista de Onboarding debe reprogramar la sesión educadamente. **Regla de oro:** Nunca iniciar el Onboarding si falta un elemento del Checklist Crítico.
