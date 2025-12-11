const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let whatsappClient: any = null;
let isReady = false;
let qrCodeData: string | null = null;

// Initialize WhatsApp client
export async function initializeWhatsAppClient() {
  if (whatsappClient) {
    return whatsappClient;
  }

  console.log("🔄 Initializing WhatsApp client...");

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  // QR code event
  whatsappClient.on("qr", (qr: string) => {
    console.log("📱 WhatsApp QR Code:");
    qrcode.generate(qr, { small: true });
    qrCodeData = qr;
    console.log("👆 Scan this QR code with WhatsApp on your phone");
  });

  // Ready event
  whatsappClient.on("ready", () => {
    console.log("✅ WhatsApp client is ready!");
    isReady = true;
    qrCodeData = null;
  });

  // Auth failure
  whatsappClient.on("auth_failure", (msg: string) => {
    console.error("❌ WhatsApp auth failed:", msg);
    isReady = false;
  });

  // Disconnected
  whatsappClient.on("disconnected", (reason: string) => {
    console.log("📭 WhatsApp disconnected:", reason);
    isReady = false;
  });

  // Initialize
  await whatsappClient.initialize();

  return whatsappClient;
}

export function getWhatsAppClient() {
  return whatsappClient;
}

export function isWhatsAppReady() {
  return isReady;
}

export function getQRCode() {
  return qrCodeData;
}
