//screens/CreateTicketScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Dimensions, SafeAreaView, TextInput, Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_URL } from '../config';

const { width } = Dimensions.get('window');

const THEME = {
  bg: ['#0f0c29', '#302b63'],
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  accent: '#a29bfe',
  btnSubmit: ['#ff00cc', '#3333ff'],
  inputBg: 'rgba(0, 0, 0, 0.2)'
};

// Kategori Verileri
const CATEGORIES = [
  { id: 'Donanım Arızası', label: 'Donanım Arızası', icon: 'monitor' },
  { id: 'Yazılım Hatası', label: 'Yazılım Hatası', icon: 'bug' },
  { id: 'Ağ/Erişim Sorunu', label: 'Ağ/Erişim Sorunu', icon: 'wifi' },
  { id: 'Hesap/Şifre İşlemleri', label: 'Hesap/Şifre İşlemleri', icon: 'account-lock' },
  { id: 'Yeni Donanım Talebi', label: 'Yeni Donanım Talebi', icon: 'cart' },
  { id: 'Yeni Yazılım Kurulumu', label: 'Yeni Yazılım Kurulumu', icon: 'cog' },
  { id: 'Telefon/İletişim', label: 'Telefon/İletişim', icon: 'phone' },
  { id: 'E-posta Sorunu', label: 'E-posta Sorunu', icon: 'email' },
  { id: 'Eğitim Talebi', label: 'Eğitim Talebi', icon: 'school' },
  { id: 'Diğer/Genel Destek', label: 'Diğer/Genel Destek', icon: 'help-circle' },
];

const PRIORITIES = [
  { id: 'Düşük', label: 'Düşük', color: '#2ecc71' },
  { id: 'Orta', label: 'Orta', color: '#f1c40f' },
  { id: 'Yüksek', label: 'Yüksek', color: '#e67e22' },
  { id: 'Kritik', label: 'Kritik', color: '#e74c3c' },
];

export default function CreateTicketScreen() {
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedPri, setSelectedPri] = useState('Düşük');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [photo, setPhoto] = useState(null); // { uri, base64, mimeType }

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('userInfo');
      if (stored) setUserInfo(JSON.parse(stored));
    };
    loadUser();
  }, []);

  // Fotoğraf seçme - Galeri
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmedi.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  // Fotoğraf seçme - Kamera
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni verilmedi.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  // Fotoğraf seçim menüsü
  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }
    Alert.alert(
      'Fotoğraf Ekle',
      'Fotoğrafı nereden eklemek istersiniz?',
      [
        { text: 'Kamera', onPress: pickFromCamera },
        { text: 'Galeri', onPress: pickFromGallery },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!selectedCat) {
      Alert.alert('Uyarı', 'Lütfen bir kategori seçin.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir açıklama yazın.');
      return;
    }
    if (!userInfo?._id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      setSubmitting(true);

      const requestBody = {
        category: selectedCat,
        priority: selectedPri,
        description: description.trim(),
        creatorId: userInfo._id,
      };

      // Fotoğraf varsa ekle
      if (photo?.base64) {
        requestBody.photo = {
          data: photo.base64,
          mimeType: photo.mimeType || 'image/jpeg',
        };
      }

      await axios.post(`${BACKEND_URL}/api/tickets`, requestBody);

      setSubmitted(true);
      // Formu sıfırla
      setTimeout(() => {
        setSelectedCat(null);
        setSelectedPri('Düşük');
        setDescription('');
        setPhoto(null);
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.log('Talep gönderme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Talep oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  // Başarı Ekranı
  if (submitted) {
    return (
      <LinearGradient colors={THEME.bg} style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons name="check-circle" size={70} color="#2ecc71" />
          </View>
          <Text style={styles.successTitle}>Talep Başarıyla Oluşturuldu!</Text>
          <Text style={styles.successSub}>
            Talebiniz manager onayına gönderildi.{'\n'}Onaylandıktan sonra ilgili IT personeline atanacaktır.
          </Text>
          <View style={styles.successInfo}>
            <View style={styles.successRow}>
              <MaterialCommunityIcons name="folder" size={16} color={THEME.accent} />
              <Text style={styles.successLabel}>Kategori:</Text>
              <Text style={styles.successValue}>{selectedCat}</Text>
            </View>
            <View style={styles.successRow}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#f1c40f" />
              <Text style={styles.successLabel}>Öncelik:</Text>
              <Text style={styles.successValue}>{selectedPri}</Text>
            </View>
            <View style={styles.successRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#e67e22" />
              <Text style={styles.successLabel}>Durum:</Text>
              <Text style={[styles.successValue, { color: '#f1c40f' }]}>Onay Bekliyor</Text>
            </View>
            {photo && (
              <View style={styles.successRow}>
                <MaterialCommunityIcons name="camera" size={16} color="#2ecc71" />
                <Text style={styles.successLabel}>Fotoğraf:</Text>
                <Text style={[styles.successValue, { color: '#2ecc71' }]}>Eklendi ✓</Text>
              </View>
            )}
          </View>
          <ActivityIndicator size="small" color={THEME.accent} style={{ marginTop: 20 }} />
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>Yeni form yükleniyor...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={THEME.bg} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.mainTitle}>Yeni Destek Talebi</Text>
          <Text style={styles.subTitle}>Sorununuzu en iyi anlatan kategoriyi ve aciliyetini seçin.</Text>

          {/* 1. KATEGORİ SEÇİN */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>1.</Text>
            <Text style={styles.sectionTitle}>Kategori Seçin</Text>
          </View>
          
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryCard, selectedCat === cat.id && styles.activeCard]}
                onPress={() => setSelectedCat(cat.id)}
              >
                <MaterialCommunityIcons 
                  name={cat.icon} 
                  size={24} 
                  color={selectedCat === cat.id ? THEME.accent : '#fff'} 
                />
                <Text style={[styles.categoryLabel, selectedCat === cat.id && { color: THEME.accent }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 2. TALEP ACİLİYETİ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>2.</Text>
            <Text style={styles.sectionTitle}>Talep Aciliyeti Seçiniz</Text>
          </View>

          <View style={styles.priorityRow}>
            {PRIORITIES.map((pri) => (
              <TouchableOpacity 
                key={pri.id} 
                style={[
                    styles.priorityBtn, 
                    selectedPri === pri.id && { backgroundColor: pri.color, borderColor: pri.color }
                ]}
                onPress={() => setSelectedPri(pri.id)}
              >
                <Ionicons 
                    name="alert-circle-outline" 
                    size={14} 
                    color={selectedPri === pri.id ? '#fff' : 'rgba(255,255,255,0.4)'} 
                />
                <Text style={[styles.priorityText, selectedPri === pri.id && { color: '#fff' }]}>
                  {pri.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. AÇIKLAMA */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>3.</Text>
            <Text style={styles.sectionTitle}>Açıklama</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Sorununuzu buraya detaylandırın..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
              {...Platform.select({ web: { outlineStyle: 'none' } })}
            />
          </View>

          {/* 4. FOTOĞRAF EKLE (OPSİYONEL) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>4.</Text>
            <Text style={styles.sectionTitle}>Fotoğraf Ekle</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>İsteğe Bağlı</Text>
            </View>
          </View>

          {!photo ? (
            <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhoto} activeOpacity={0.7}>
              <View style={styles.photoPickerInner}>
                <View style={styles.photoIconCircle}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={32} color={THEME.accent} />
                </View>
                <Text style={styles.photoPickerTitle}>Fotoğraf Ekleyin</Text>
                <Text style={styles.photoPickerSub}>Kamera veya galeriden seçin</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setPhoto(null)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#e74c3c" />
              </TouchableOpacity>
              <View style={styles.photoOverlayInfo}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#2ecc71" />
                <Text style={styles.photoOverlayText}>Fotoğraf eklendi</Text>
              </View>
            </View>
          )}

          {/* GÖNDER BUTONU */}
          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]} 
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient colors={THEME.btnSubmit} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.gradientBtn}>
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Talebi Gönder</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Bilgi Notu */}
          <View style={styles.infoNote}>
            <MaterialCommunityIcons name="information-outline" size={16} color={THEME.accent} />
            <Text style={styles.infoNoteText}>
              Talebiniz oluşturulduktan sonra manager onayına gönderilecek ve uygun IT personeline atanacaktır.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  mainTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  subTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 5, marginBottom: 25 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionNumber: { color: THEME.accent, fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    width: (width - 60) / 3,
    height: 90,
    backgroundColor: THEME.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    padding: 5
  },
  activeCard: { borderColor: THEME.accent, backgroundColor: 'rgba(162, 155, 254, 0.1)' },
  categoryLabel: { color: '#fff', fontSize: 9, textAlign: 'center', marginTop: 8, fontWeight: '600' },

  priorityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3
  },
  priorityText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold', marginLeft: 5 },

  inputContainer: { 
    backgroundColor: THEME.inputBg, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: THEME.border, 
    padding: 15, 
    marginBottom: 25 
  },
  textInput: { color: '#fff', fontSize: 14, minHeight: 100 },

  // Fotoğraf Ekleme
  optionalBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(162, 155, 254, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  optionalText: { color: THEME.accent, fontSize: 10, fontWeight: '600' },

  photoPickerBtn: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderStyle: 'dashed',
    marginBottom: 25,
    overflow: 'hidden',
  },
  photoPickerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  photoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(162, 155, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoPickerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  photoPickerSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },

  photoPreviewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 25,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 15,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 2,
  },
  photoOverlayInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  photoOverlayText: { color: '#2ecc71', fontSize: 12, fontWeight: '600' },

  submitBtn: { height: 55, borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // Bilgi Notu
  infoNote: { 
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 20,
    backgroundColor: 'rgba(162, 155, 254, 0.08)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(162, 155, 254, 0.15)',
  },
  infoNoteText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, flex: 1, lineHeight: 18 },

  // Başarı Ekranı
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  successCircle: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: 'rgba(46,204,113,0.1)', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: 'rgba(46,204,113,0.2)',
  },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  successSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  successInfo: { 
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 18, marginTop: 24, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  successLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  successValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
});