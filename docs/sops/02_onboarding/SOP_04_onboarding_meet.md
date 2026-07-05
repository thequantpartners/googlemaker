# SOP-004: "White-Glove" Onboarding Meet

**ID del Proceso:** QSS-SOP-004 | **Versión:** 1.0 
**Dueño del Proceso (Owner):** Head of Onboarding

## 1. Propósito y Alcance
Sortear la limitación técnica de cuentas maestras configurando Ycloud, Meta Business y Google Ads directamente en las propiedades del cliente. Inicia con la llamada y termina cuando las credenciales están en el Vault.

## 2. Matriz RACI
- **Responsible (Ejecuta):** Especialista de Onboarding
- **Accountable (Aprueba/Dueño):** Head of Onboarding
- **Consulted (Consulta):** Tech Lead
- **Informed (Se Informa):** Cliente

## 3. Inputs & Outputs
- **Inputs:** Cliente en Zoom con Checklist Crítico completo.
- **Outputs:** Ycloud API Key y Google Ads MCC acceso guardados de forma segura; plantilla transaccional aprobada.

## 4. Herramientas y Seguridad
- **Software:** Zoom, Ycloud, Meta Business Suite, Google Ads, Gestor de Contraseñas / Secret Vault (Ej. 1Password).
- **Seguridad:** Las API keys extraídas NUNCA deben enviarse por Slack o Email. Solo almacenarse en el Vault seguro del equipo técnico.

## 5. Checklist de Ejecución (Paso a Paso)
- [ ] **Bienvenida (2 min):** Confirmar checklist. Pedirle al cliente que comparta pantalla.
- [ ] **Ycloud & Meta (15 min):** 
  - Registrar al cliente en Ycloud.
  - Ejecutar el "Embedded Signup" de Meta (Login con Facebook).
  - Registrar la SIM/Chip nuevo y verificar vía código SMS.
- [ ] **Plantilla de Alerta (5 min):**
  - Crear la plantilla *Utility* en Ycloud: `"🚨 NUEVO CASO PAGADO 🚨 Cliente: {{1}}, Urgencia: {{2}}, Contacto: wa.me/{{3}}"`
  - Enviar a revisión.
- [ ] **Google Ads (15 min):**
  - Crear cuenta en ads.google.com.
  - Añadir la tarjeta de crédito del cliente.
  - Aprobar la solicitud de vinculación a nuestro MCC (Agencia).
- [ ] **Cierre (5 min):** 
  - Extraer Ycloud API Key y WABA ID.
  - Agradecer y comunicar el SLA de 72 horas para el lanzamiento.

## 6. Contingencias y Troubleshooting
- **Meta bloquea la cuenta (IP Inusual):** Guiar al cliente inmediatamente a subir la documentación de registro comercial de su despacho legal en el portal de Calidad de Cuenta de Meta.
- **Plantilla rechazada en vivo:** Replantear el texto eliminando cualquier adjetivo (hacerlo puramente transaccional) y reenviar.
