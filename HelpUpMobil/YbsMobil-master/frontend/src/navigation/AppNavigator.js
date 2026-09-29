import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Ekranları içeri aktarıyoruz
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen'; // Burayı ekledik

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" // Uygulama Login ile başlasın
        screenOptions={{ 
          headerShown: false, // Üstteki varsayılan beyaz barı tasarım bozulmasın diye kaldırdık
          animationEnabled: true // Ekranlar arası geçiş animasyonu açık
        }}
      >
        {/* Giriş Ekranı */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Dashboard (Admin/Panel) Ekranı */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}