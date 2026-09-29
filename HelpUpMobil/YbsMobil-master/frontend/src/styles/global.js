import { StyleSheet, Platform, StatusBar } from 'react-native';

// 1. index.css'den gelen renk kodlarını buraya sabitledik
export const COLORS = {
  bgStart: '#181838', // Koyu Mor (Ana Zemin)
  bgEnd: '#764ba2',   // Açık Mor (Gradyan Bitiş)
  white: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  link: '#646cff',    // Web'deki a etiketi rengin
  buttonBg: '#1a1a1a', // Web'deki buton rengin
  inputBg: 'rgba(0, 0, 0, 0.3)',
  border: 'rgba(255, 255, 255, 0.2)',
};

// 2. Projenin her yerinde geçerli olacak temel stiller
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // index.css'deki "color: white" kuralı
  mainText: {
    color: COLORS.white,
    fontSize: 16,
  },
  // Cam efekti (Glassmorphism) kartı
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 25,
  },
  // Standart Buton (Web'deki button etiketi gibi)
  primaryButton: {
    backgroundColor: COLORS.buttonBg,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 16,
  }
});