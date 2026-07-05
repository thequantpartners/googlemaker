# SOP-002: Discovery Call y Cierre de Ventas

**ID del Proceso:** QSS-SOP-002 | **Versión:** 1.0 
**Dueño del Proceso (Owner):** Sales Manager

## 1. Propósito y Alcance
Diagnosticar la situación actual del abogado, demostrar la viabilidad del embudo QSS, superar objeciones y cerrar la venta procesando el *Setup Fee* en vivo. El alcance finaliza cuando el cobro es exitoso.

## 2. Matriz RACI
- **Responsible (Ejecuta):** Account Executive / Closer
- **Accountable (Aprueba/Dueño):** Sales Manager
- **Consulted (Consulta):** Tech Lead (en caso de integraciones muy específicas)
- **Informed (Se Informa):** Especialista de Onboarding

## 3. Inputs & Outputs
- **Inputs:** Lead calificado asiste a la llamada de Zoom.
- **Outputs:** Cobro de Stripe/MercadoPago exitoso y lead pasado a estado "Cliente Activo".

## 4. Herramientas y Seguridad
- **Software:** Zoom/Google Meet, CRM, Stripe/MercadoPago, Deck de Ventas (Pitch Deck).
- **Seguridad:** No guardar números de tarjeta de crédito en notas; usar siempre enlaces seguros de Stripe.

## 5. Checklist de Ejecución (Paso a Paso)
- [ ] **Rapport y Diagnóstico (10 min):** Entender sus procesos actuales, cuánto cobran por consulta, y su volumen actual de "leads basura".
- [ ] **Presentación (15 min):** Mostrar el diagrama del embudo QSS (enfocado en el WIIFM: "Tú solo hablas con quien ya pagó").
- [ ] **Manejo de Objeciones:**
  - *Objeción Legal/Ética:* Aclarar que el bot actúa como un asistente administrativo, no brinda consejo legal.
  - *Objeción Técnica:* Recalcar el servicio "Done-For-You" y el *White-Glove Onboarding*.
- [ ] **Cierre (10 min):** Presentar el precio y la garantía.
- [ ] **Cobro en Vivo:** Generar y enviar el enlace de pago por el chat de Zoom. **No colgar hasta que Stripe confirme el pago.**

## 6. Contingencias y Troubleshooting
- **Tarjeta Declinada:** Pedir tranquilamente una segunda tarjeta en la misma llamada o generar un enlace de transferencia bancaria inmediata (Ej. Yape/Plin en Latam o Zelle en USA).
- **Necesita consultar al socio:** Agendar inmediatamente la "Llamada de Resolución" en máximo 24 horas para no enfriar el prospecto.
