//screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, Dimensions, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const { width } = Dimensions.get('window');

const THEME = {
  bg: ['#0f0c29', '#302b63'],
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  accent: '#a29bfe',
  inputBg: 'rgba(0,0,0,0.2)',
  buttonGrad: ['#6366f1', '#a855f7'],
  orangeGrad: ['#f093fb', '#f5576c'] 
};

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('bilgi'); // 'bilgi' veya 'sifre'
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form States - Profile
  const [name, setName] = useState('');
  
  // Form States - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('userInfo');
      if (stored) {
        const user = JSON.parse(stored);
        setUserInfo(user);
        setName(user.name || '');
      }
    };
    loadUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Uyarı', 'İsim alanı boş bırakılamaz.');
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${BACKEND_URL}/api/auth/profile`, 
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local storage and state
      const updatedUser = response.data;
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUserInfo(updatedUser);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.message || 'Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Uyarı', 'Lütfen tüm şifre alanlarını doldurun.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Uyarı', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BACKEND_URL}/api/auth/password`, 
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.message || 'Şifre güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userInfo');
    navigation.replace('Login');
  };

  if (!userInfo) return <View style={styles.container}><ActivityIndicator color="#fff" /></View>;

  // Avatar harfi
  const initialLetter = userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* SOLDAKİ ÖZET KARTI */}
      <View style={styles.profileSummaryCard}>
        <LinearGradient colors={['rgba(162, 155, 254, 0.2)', 'transparent']} style={styles.summaryGrad} />
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{initialLetter}</Text>
        </View>
        <Text style={styles.userName}>{userInfo.name}</Text>
        <Text style={styles.userRole}>{userInfo.role || 'USER'}</Text>
        <Text style={styles.userEmail}>{userInfo.email}</Text>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Aktif</Text>
          <Text style={styles.statusLabel}>Durum</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={16} color="#ff6b6b" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* SEKMELER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'bilgi' && styles.tabActive]} 
          onPress={() => setActiveTab('bilgi')}
        >
          <MaterialCommunityIcons name="account-outline" size={18} color={activeTab === 'bilgi' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'bilgi' && styles.tabTextActive]}>Profil Bilgileri</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'sifre' && styles.tabActive]} 
          onPress={() => setActiveTab('sifre')}
        >
          <MaterialCommunityIcons name="lock-outline" size={18} color={activeTab === 'sifre' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'sifre' && styles.tabTextActive]}>Şifre Değiştir</Text>
        </TouchableOpacity>
      </View>

      {/* FORM ALANI */}
      <View style={styles.formCard}>
        {activeTab === 'bilgi' ? (
          <View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>İsim Soyisim</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName}
                placeholderTextColor="#666" 
                {...Platform.select({ web: { outlineStyle: 'none' } })}
              />
            </View>

            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>E-Posta (Değiştirilemez)</Text>
              <TextInput 
                style={[styles.input, { opacity: 0.6 }]} 
                value={userInfo.email} 
                editable={false} 
              />
            </View>

            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>Rol (Değiştirilemez)</Text>
              <TextInput 
                style={[styles.input, { opacity: 0.6 }]} 
                value={userInfo.role || 'Standart Kullanıcı'} 
                editable={false} 
              />
            </View>

            <TouchableOpacity style={[styles.actionBtn, loading && { opacity: 0.7 }]} onPress={handleUpdateProfile} disabled={loading}>
              <LinearGradient colors={THEME.buttonGrad} style={styles.btnGrad}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <MaterialCommunityIcons name="update" size={20} color="#fff" />
                    <Text style={styles.btnText}>Bilgileri Güncelle</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>Mevcut Şifre</Text>
              <View style={styles.passwordWrapper}>
                <MaterialCommunityIcons name="key-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.passInput} 
                  secureTextEntry 
                  placeholder="Şu anki şifreniz" 
                  placeholderTextColor="#444"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  {...Platform.select({ web: { outlineStyle: 'none' } })}
                />
              </View>
            </View>

            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.passwordWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.passInput} 
                  secureTextEntry 
                  placeholder="Yeni şifreniz" 
                  placeholderTextColor="#444" 
                  value={newPassword}
                  onChangeText={setNewPassword}
                  {...Platform.select({ web: { outlineStyle: 'none' } })}
                />
              </View>
            </View>

            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <View style={styles.passwordWrapper}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.passInput} 
                  secureTextEntry 
                  placeholder="Şifreyi onaylayın" 
                  placeholderTextColor="#444" 
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  {...Platform.select({ web: { outlineStyle: 'none' } })}
                />
              </View>
            </View>

            <TouchableOpacity style={[styles.actionBtn, loading && { opacity: 0.7 }]} onPress={handleUpdatePassword} disabled={loading}>
              <LinearGradient colors={THEME.orangeGrad} style={styles.btnGrad}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <MaterialCommunityIcons name="shield-key" size={20} color="#fff" />
                    <Text style={styles.btnText}>Şifreyi Değiştir</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  profileSummaryCard: { 
    backgroundColor: THEME.card, borderRadius: 25, padding: 25, 
    alignItems: 'center', borderWidth: 1, borderColor: THEME.border, marginBottom: 20 
  },
  summaryGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 25 },
  avatarCircle: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.accent, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)'
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize' },
  userRole: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginVertical: 4 },
  userEmail: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  statusBadge: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 30, backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: 15, alignItems: 'center' },
  statusText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 14 },
  statusLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)', gap: 6 },
  logoutText: { color: '#ff6b6b', fontWeight: 'bold', fontSize: 13 },

  tabContainer: { flexDirection: 'row', backgroundColor: THEME.card, borderRadius: 15, padding: 5, marginBottom: 20, borderWidth: 1, borderColor: THEME.border },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8, borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(162, 155, 254, 0.2)' },
  tabText: { color: '#666', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  formCard: { backgroundColor: THEME.card, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  inputGroup: { flex: 1, marginBottom: 15 },
  inputGroupFull: { width: '100%', marginBottom: 15 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: THEME.inputBg, borderRadius: 12, padding: 12, color: '#fff', borderWidth: 1, borderColor: THEME.border },
  
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  inputIcon: { paddingHorizontal: 12 },
  passInput: { flex: 1, paddingVertical: 12, color: '#fff' },

  actionBtn: { marginTop: 10, borderRadius: 15, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});