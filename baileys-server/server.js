import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const QSS_API_URL = process.env.QSS_API_URL || 'https://googlemaker-production.up.railway.app';
const QSS_CLIENT_ID = process.env.QSS_CLIENT_ID;
const QSS_WEBHOOK_SECRET = process.env.QSS_WEBHOOK_SECRET;

let sock = null;
let connectionStatus = 'disconnected';
let currentQR = null;

async function connectToWhatsApp() {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
        return;
    }
    
    connectionStatus = 'connecting';
    currentQR = null;

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            markOnlineOnConnect: true,
            logger: pino({ level: 'silent' })
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log("[!] QR Recibido");
                currentQR = qr; // Guardamos el string puro del QR
                connectionStatus = 'qr_ready';
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('[!] Conexión cerrada. Reconectando:', shouldReconnect);
                connectionStatus = 'disconnected';
                currentQR = null;
                sock = null;
                if(shouldReconnect) {
                    setTimeout(connectToWhatsApp, 3000);
                }
            } else if(connection === 'open') {
                console.log('[✓] WhatsApp conectado exitosamente');
                connectionStatus = 'connected';
                currentQR = null;
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Escuchar mensajes entrantes
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (!text) return;

            const senderId = msg.key.remoteJid.replace('@s.whatsapp.net', '');
            const senderName = msg.pushName || "Usuario";
            
            console.log(`[+] Mensaje de ${senderName}: ${text}`);
            
            if (!QSS_CLIENT_ID || !QSS_WEBHOOK_SECRET) {
                console.log("[X] Faltan variables de entorno QSS_CLIENT_ID o QSS_WEBHOOK_SECRET");
                return;
            }

            try {
                const response = await axios.post(
                    `${QSS_API_URL}/webhooks/baileys?client_id=${QSS_CLIENT_ID}`, 
                    { wa_id: senderId, text: text, name: senderName },
                    { headers: { 'x-webhook-secret': QSS_WEBHOOK_SECRET, 'Content-Type': 'application/json' } }
                );

                if (response.data && response.data.ok && response.data.reply) {
                    const remoteJid = msg.key.remoteJid;
                    const replyText = response.data.reply;
                    
                    // 1. Marcar como leído
                    await sock.readMessages([msg.key]);

                    // 2. Estado de "escribiendo..."
                    await sock.sendPresenceUpdate('available', remoteJid);
                    await sock.sendPresenceUpdate('composing', remoteJid);

                    // 3. Simular tiempo de escritura humano MUCHo más lento
                    // 4 segundos base + 80ms por letra (máximo 15 segundos)
                    const delayMs = Math.min(4000 + (replyText.length * 80), 15000);
                    await new Promise(resolve => setTimeout(resolve, delayMs));

                    // 4. Detener estado "escribiendo..."
                    await sock.sendPresenceUpdate('paused', remoteJid);

                    // 5. Enviar respuesta final
                    await sock.sendMessage(remoteJid, { text: replyText });
                }
            } catch (error) {
                console.error(`[X] Error QSS API:`, error.message);
            }
        });
    } catch (e) {
        console.error("Error inicializando Baileys:", e);
        connectionStatus = 'disconnected';
    }
}

// Iniciar conexión automáticamente si el servidor se reinicia
console.log("Iniciando servidor de Baileys con pausas humanas de 4 a 15 segundos...");
connectToWhatsApp();

app.get('/api/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: currentQR
    });
});

app.post('/api/connect', async (req, res) => {
    if (connectionStatus === 'disconnected') {
        connectToWhatsApp();
    }
    res.json({ status: connectionStatus });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Baileys Microservice corriendo en puerto ${PORT}`);
});
