import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import axios from 'axios';

// ==========================================
// CONFIGURACIÓN DE TU BACKEND (QSS)
// ==========================================
// Reemplaza con tu Client ID de QSS
const CLIENT_ID = "TU_CLIENT_ID_AQUI"; 
// Reemplaza con la URL de tu backend en producción o local (ej. http://localhost:8000)
const QSS_API_URL = "http://localhost:8000"; 
// Reemplaza con tu Generic Webhook Secret configurado en Pagos/Integraciones
const WEBHOOK_SECRET = "TU_SECRET_AQUI"; 

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Configurar Baileys
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Silenciar logs extensos
        browser: ['QSS Experimental Bot', 'Chrome', '1.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("\n[!] Escanea el código QR con tu WhatsApp para conectar:\n");
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('\n[!] Conexión cerrada. Reconectando...', shouldReconnect);
            if(shouldReconnect) connectToWhatsApp();
        } else if(connection === 'open') {
            console.log('\n[✓] WhatsApp conectado exitosamente al Bot Experimental de QSS!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Escuchar mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        
        // Ignorar mensajes enviados por nosotros mismos o que no tengan texto
        if (!msg.message || msg.key.fromMe) return;

        // Extraer texto del mensaje (puede venir en diferentes formatos)
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) return;

        const senderId = msg.key.remoteJid.replace('@s.whatsapp.net', '');
        const senderName = msg.pushName || "Usuario";
        
        console.log(`\n[+] Mensaje recibido de ${senderName} (${senderId}): ${text}`);
        
        try {
            console.log(`    -> Enviando al cerebro QSS (FastAPI)...`);
            
            const response = await axios.post(
                `${QSS_API_URL}/api/webhooks/baileys?client_id=${CLIENT_ID}`, 
                {
                    wa_id: senderId,
                    text: text,
                    name: senderName
                },
                {
                    headers: {
                        'x-webhook-secret': WEBHOOK_SECRET,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.ok && response.data.reply) {
                console.log(`    <- Respuesta del LLM recibida. Enviando a WhatsApp...`);
                await sock.sendMessage(msg.key.remoteJid, { text: response.data.reply });
            } else {
                console.log(`    [!] Respuesta inesperada del backend:`, response.data);
            }

        } catch (error) {
            console.error(`    [X] Error comunicándose con QSS API:`, error.message);
            if (error.response) {
                console.error(`        Detalle:`, error.response.data);
            }
        }
    });
}

connectToWhatsApp();
