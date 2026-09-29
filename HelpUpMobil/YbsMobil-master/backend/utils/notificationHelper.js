// backend/utils/notificationHelper.js
// Expo Push Notification gönderimi için yardımcı fonksiyon

async function sendPushNotification(pushTokens, title, body, data = {}) {
  // Geçersiz token'ları filtrele
  const validTokens = pushTokens.filter(
    (token) => token && typeof token === 'string' && token.startsWith('ExponentPushToken[')
  );

  if (validTokens.length === 0) {
    console.log('[Bildirim] Geçerli push token bulunamadı, bildirim gönderilmedi.');
    return;
  }

  // Her token için bir mesaj oluştur
  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  // Expo Push API'sine toplu gönderim (chunk'lar halinde, max 100)
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      console.log('[Bildirim] Gönderim sonucu:', JSON.stringify(result.data?.length || 0), 'bildirim');
    } catch (error) {
      console.error('[Bildirim] Gönderim hatası:', error.message);
    }
  }
}

module.exports = { sendPushNotification };
