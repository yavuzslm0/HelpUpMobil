import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push bildirimleri için izin alınamadı!');
      return null;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Token alınırken hata:', e);
    }
  } else {
    console.log('Fiziksel cihaz kullanılmıyor, push bildirimleri emülatörde çalışmaz.');
  }

  return token;
}

export async function savePushTokenToBackend(expoPushToken, userToken) {
  if (!expoPushToken || !userToken) return;
  
  try {
    await axios.put(
      `${BACKEND_URL}/api/auth/push-token`,
      { expoPushToken },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    console.log('Push token backend\'e kaydedildi.');
  } catch (error) {
    console.log('Push token backend\'e kaydedilirken hata:', error);
  }
}
