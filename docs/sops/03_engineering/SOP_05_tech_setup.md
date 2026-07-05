# SOP-005: Tech Setup & Assembly

**ID del Proceso:** QSS-SOP-005 | **Versión:** 1.0 
**Dueño del Proceso (Owner):** Tech Lead

## 1. Propósito y Alcance
Desplegar la infraestructura tecnológica (Landing Page, Bot IA y Campañas de Ads) basándose en las credenciales obtenidas en el Onboarding. El SLA (Acuerdo de Nivel de Servicio) interno es de 72 horas.

## 2. Matriz RACI
- **Responsible (Ejecuta):** Ingeniero Técnico / Media Buyer
- **Accountable (Aprueba/Dueño):** Tech Lead
- **Consulted (Consulta):** Especialista de Onboarding (sobre detalles específicos del cliente)
- **Informed (Se Informa):** Customer Success Manager

## 3. Inputs & Outputs
- **Inputs:** Credenciales de Ycloud y Google Ads subidas al Vault.
- **Outputs:** Entorno completo desplegado y listo para las pruebas *End-to-End*.

## 4. Herramientas y Seguridad
- **Software:** Next.js (Repositorio Base QSS), Vercel, Ycloud API, OpenAI API, Make/Backend FastAPI, Google Ads Editor.
- **Seguridad:** Inyectar las API keys del cliente únicamente como variables de entorno (`.env`) en el proyecto. No hardcodear.

## 5. Checklist de Ejecución (Paso a Paso)
### Landing Page
- [ ] Clonar el repositorio Next.js.
- [ ] Reemplazar copys base con el nombre, jurisdicción y fotos del abogado.
- [ ] Desplegar en Vercel y configurar subdominio (Ej. `defensa.abogadoX.com`).

### Integración Backend e IA
- [ ] Configurar el Webhook de Ycloud hacia el endpoint de FastAPI.
- [ ] Inyectar el *System Prompt* base para penalistas, adaptando el nombre del estudio.
- [ ] Verificar el enlace de cobro de Stripe/MercadoPago en la lógica del bot.

### Google Ads
- [ ] Subir la estructura de campañas base vía Google Ads Editor.
- [ ] Configurar Keywords en "Exact" y "Phrase Match" (Ej. "abogado para detención").
- [ ] Configurar las etiquetas de conversión vinculadas al clic de WhatsApp.

## 6. Contingencias y Troubleshooting
- **El Webhook de Ycloud falla (404/500):** Validar en los logs del servidor si la petición llega. Comprobar que la URL del Webhook en Ycloud no tenga errores de sintaxis y que el servidor de FastAPI esté expuesto correctamente.
