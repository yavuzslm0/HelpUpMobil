//screens/LoginScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Modal, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { registerForPushNotificationsAsync, savePushTokenToBackend } from '../services/notificationService';

const THEME_COLORS = {
  bgStart: '#0f0c29',
  bgEnd: '#302b63',
  buttonGrad: ['#6366f1', '#a855f7'],
  link: '#a29bfe',
  inputBg: '#1e1e3d',
  glassCard: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.12)',
  modalBg: '#1e293b'
};

// --- DIŞ BİLEŞEN: CustomInput (Odak kaybını önlemek için dışarıda) ---
const CustomInput = ({ 
  icon, placeholder, secure, type, value, onChangeText, 
  showPassword, setShowPassword 
}) => (
  <View style={styles.inputWrapper}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={18} color="#a29bfe" />
    </View>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.4)"
      secureTextEntry={secure && !showPassword}
      keyboardType={type || 'default'}
      value={value}
      onChangeText={onChangeText}
      underlineColorAndroid="transparent"
      selectionColor="#fff"
      cursorColor="#fff"
      {...Platform.select({
        web: { outlineStyle: 'none' } 
      })}
    />
    {secure && (
      <TouchableOpacity 
        style={styles.eyeIcon} 
        onPress={() => setShowPassword(!showPassword)}
        {...Platform.select({ web: { cursor: 'pointer' } })}
      >
        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>
    )}
  </View>
);


export default function LoginScreen({ navigation }) {
  const [view, setView] = useState('login');
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // State Yönetimi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password
      });
      
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
      
      // Bildirim Token'ını al ve kaydet
      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) {
        await savePushTokenToBackend(expoPushToken, response.data.token);
      }
      
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Giriş Başarısız', error.response?.data?.message || 'Geçersiz e-posta veya şifre.');
    }
  };

  const handleRegister = async () => {
    if (!regEmail || !regPassword || !firstName || !lastName) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        name: `${firstName} ${lastName}`,
        email: regEmail,
        password: regPassword
      });
      
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
      
      // Bildirim Token'ını al ve kaydet
      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) {
        await savePushTokenToBackend(expoPushToken, response.data.token);
      }
      
      Alert.alert("Başarılı", "Kayıt tamamlandı.");
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Kayıt Başarısız', error.response?.data?.message || 'Bir hata oluştu.');
    }
  };

  return (
    <LinearGradient colors={[THEME_COLORS.bgStart, THEME_COLORS.bgEnd]} style={styles.container}>
      
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Kullanıcı Hizmet Sözleşmesi</Text>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>1. Giriş: Bu sözleşme, HelpUP hizmetlerini kullanan herkes için bağlayıcıdır.</Text>
              <Text style={styles.modalText}>2. Veri Gizliliği: Kişisel verileriniz KVKK kapsamında korunmaktadır.</Text>
              <Text style={styles.modalText}>3. Sorumluluk Reddi: Sistem üzerindeki arıza bildirimleri şirket içi prosedürlere tabidir.</Text>
              <Text style={styles.modalSubText}>Lütfen devam etmek için bu koşulları okuyup onaylayınız.</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBtnClose, styles.webPointer]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnAccept, styles.webPointer]} onPress={() => {setTermsAccepted(true); setModalVisible(false);}}>
                <Text style={styles.modalBtnText}>Okudum, Onaylıyorum</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name={view === 'register' ? "rocket-launch" : "monitor-cellphone"} size={50} color="white" />
            </View>
            <Text style={styles.mainTitle}>HELP UP</Text>
            <Text style={styles.subTitle}>{view === 'login' ? 'Destek Çözümünüz' : view === 'register' ? 'Yeni bir hesap oluşturun' : 'Şifremi Unuttum'}</Text>
          </View>

          <View style={styles.glassCard}>
            {view === 'login' ? (
              <>
                <Text style={styles.label}>E-posta</Text>
                <CustomInput value={email} onChangeText={setEmail} icon="person-outline" placeholder="E-posta adresiniz" type="email-address" />
                <Text style={styles.label}>Şifre</Text>
                <CustomInput value={password} onChangeText={setPassword} icon="lock-closed-outline" placeholder="Şifreniz" secure={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                <View style={styles.row}>
                    <TouchableOpacity style={[styles.checkRow, styles.webPointer]} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                        <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                          {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                        </View>
                        <Text style={styles.miniText}>Beni hatırla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.webPointer} onPress={() => setView('forgot')}><Text style={styles.miniText}>Şifremi unuttum</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
                  <LinearGradient colors={THEME_COLORS.buttonGrad} style={styles.staticBtn}><Text style={styles.btnText}>Giriş Yap</Text></LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.webPointer} onPress={() => setView('register')}><Text style={styles.switchText}>Hesabınız yok mu? <Text style={styles.boldText}>Buradan kaydolun</Text></Text></TouchableOpacity>
              </>
            ) : view === 'register' ? (
              <>
                <View style={styles.nameRow}>
                    <View style={styles.nameInputContainer}>
                        <Text style={styles.label}>İsim</Text>
                        <CustomInput value={firstName} onChangeText={setFirstName} icon="person-outline" placeholder="Adınız" />
                    </View>
                    <View style={styles.nameInputContainer}>
                        <Text style={styles.label}>Soyisim</Text>
                        <CustomInput value={lastName} onChangeText={setLastName} icon="card-outline" placeholder="Soyadınız" />
                    </View>
                </View>

                <Text style={styles.label}>E-posta</Text>
                <CustomInput value={regEmail} onChangeText={setRegEmail} icon="mail-outline" placeholder="ornek@trakya.edu.tr" type="email-address" />
                <Text style={styles.label}>Şifre</Text>
                <CustomInput value={regPassword} onChangeText={setRegPassword} icon="lock-closed-outline" placeholder="Güçlü bir şifre belirleyin" secure={true} showPassword={showPassword} setShowPassword={setShowPassword} />

                <View style={styles.termsRow}>
                    <TouchableOpacity style={[styles.checkRow, styles.webPointer]} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7}>
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                          {termsAccepted && <Ionicons name="checkmark" size={14} color="white" />}
                        </View>
                        <Text style={styles.miniText}>
                          <Text style={styles.underline} onPress={() => setModalVisible(true)}>Koşulları</Text> kabul ediyorum.
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.mainButton, {opacity: termsAccepted ? 1 : 0.5}, styles.webPointer]} 
                  disabled={!termsAccepted}
                  onPress={handleRegister}
                >
                  <LinearGradient colors={THEME_COLORS.buttonGrad} style={styles.staticBtn}><Text style={styles.btnText}>Kayıt Ol</Text></LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.webPointer} onPress={() => setView('login')}><Text style={styles.switchText}>Zaten hesabınız var mı? <Text style={styles.boldText}>Giriş Yap</Text></Text></TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>E-posta adresinizi girin, size bir sıfırlama linki gönderelim.</Text>
                <Text style={styles.label}>E-posta Adresi</Text>
                <CustomInput value={forgotEmail} onChangeText={setForgotEmail} icon="mail-outline" placeholder="ornek@mail.com" type="email-address" />
                <TouchableOpacity style={[styles.mainButton, styles.webPointer]}><LinearGradient colors={THEME_COLORS.buttonGrad} style={styles.staticBtn}><Text style={styles.btnText}>Sıfırlama Bağlantısı Gönder</Text></LinearGradient></TouchableOpacity>
                <TouchableOpacity onPress={() => setView('login')} style={[styles.backBtn, styles.webPointer]}><Ionicons name="arrow-back" size={16} color="white" /><Text style={styles.backBtnText}> Giriş Sayfasına Dön</Text></TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  logoArea: { alignItems: 'center', marginBottom: 30 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  mainTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  subTitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 5 },
  glassCard: {
    backgroundColor: THEME_COLORS.glassCard, borderRadius: 35, padding: 30,
    borderWidth: 1, borderColor: THEME_COLORS.border, shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10
  },
  label: { color: '#fff', fontSize: 13, marginBottom: 8, fontWeight: '700', marginLeft: 5 },
  inputWrapper: {
    flexDirection: 'row', backgroundColor: THEME_COLORS.inputBg, borderRadius: 15,
    marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: THEME_COLORS.border,
    width: '100%'
  },
  iconBox: { paddingLeft: 15 },
  input: { 
    flex: 1, 
    height: 52, 
    color: '#fff', 
    paddingHorizontal: 15, 
    fontSize: 15,
  },
  eyeIcon: { paddingRight: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  termsRow: { marginBottom: 20, marginTop: -5, marginLeft: 5 },
  underline: { textDecorationLine: 'underline', color: THEME_COLORS.link, fontWeight: 'bold' },
  checkbox: { 
    width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1.5, borderColor: THEME_COLORS.border, marginRight: 10, justifyContent: 'center', alignItems: 'center' 
  },
  checkboxActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  miniText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  mainButton: { height: 58, borderRadius: 20, overflow: 'hidden', marginBottom: 10 },
  staticBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  switchText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14, marginTop: 10 },
  boldText: { color: THEME_COLORS.link, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 5 },
  nameInputContainer: { width: '48%' },
  infoText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  backBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  webPointer: { ...Platform.select({ web: { cursor: 'pointer' } }) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME_COLORS.modalBg, borderRadius: 20, width: '100%', padding: 25, maxHeight: '80%' },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 15, marginBottom: 15 },
  modalHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalBody: { marginBottom: 20 },
  modalText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  modalSubText: { color: THEME_COLORS.link, fontSize: 12, textAlign: 'center', marginTop: 10 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  modalBtnClose: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
  modalBtnAccept: { padding: 10, backgroundColor: '#8b5cf6', borderRadius: 8 },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});