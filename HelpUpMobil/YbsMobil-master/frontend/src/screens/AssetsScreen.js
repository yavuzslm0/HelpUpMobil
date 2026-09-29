//screens/AssetsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Dimensions, TextInput, Platform, Modal, KeyboardAvoidingView, 
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const { width } = Dimensions.get('window');

const THEME = {
  bg: '#0f0c29',
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  accent: '#a29bfe',
  success: '#2ecc71',
  warning: '#f1c40f',
  danger: '#e74c3c',
  inputBg: 'rgba(0,0,0,0.3)',
  buttonGrad: ['#6366f1', '#a855f7'],
  orangeGrad: ['#f093fb', '#f5576c'],
  greenGrad: ['#11998e', '#38ef7d'],
};

// Cihaz türleri
const DEVICE_TYPES = [
  { value: 'LAPTOP', label: 'Laptop', icon: 'laptop' },
  { value: 'MONİTÖR', label: 'Monitör', icon: 'monitor' },
  { value: 'TELEFON', label: 'Telefon', icon: 'cellphone' },
  { value: 'TABLET', label: 'Tablet', icon: 'tablet' },
  { value: 'YAZICI', label: 'Yazıcı', icon: 'printer' },
  { value: 'KLAVYE', label: 'Klavye', icon: 'keyboard' },
  { value: 'MOUSE', label: 'Mouse', icon: 'mouse' },
  { value: 'DİĞER', label: 'Diğer', icon: 'devices' },
];

// Marka listesi
const BRANDS = [
  'Apple', 'Samsung', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'MSI',
  'Huawei', 'Xiaomi', 'LG', 'Sony', 'Logitech', 'Microsoft', 'Canon',
  'Epson', 'Brother', 'Casper', 'Monster', 'Diğer'
];

// Durum seçenekleri
const STATUS_OPTIONS = [
  { value: 'Zimmetli', label: 'Zimmetli', icon: 'account-check', color: THEME.accent },
  { value: 'Depoda', label: 'Depoda', icon: 'warehouse', color: THEME.success },
  { value: 'Arızalı', label: 'Arızalı', icon: 'alert-circle-outline', color: THEME.danger },
];

// Cihaz türüne göre ikon ve renk
const getTypeInfo = (type) => {
  const found = DEVICE_TYPES.find(d => d.value === type);
  return found || { icon: 'devices', label: type || 'Envanter' };
};

const getStatusInfo = (status) => {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found || { color: 'rgba(255,255,255,0.4)', icon: 'help-circle-outline', label: status || 'Bilinmiyor' };
};

// ========== SEÇİCİ BİLEŞENLERİ ==========

// Tek seçim (chip tarzı)
const ChipSelector = ({ options, selected, onSelect, label }) => (
  <View style={styles.chipField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.chipGrid}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(opt.value)}
          >
            {opt.icon && (
              <MaterialCommunityIcons 
                name={opt.icon} 
                size={16} 
                color={isSelected ? '#fff' : 'rgba(255,255,255,0.4)'} 
              />
            )}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// Durum seçici (büyük kartlar)
const StatusSelector = ({ selected, onSelect }) => (
  <View style={styles.chipField}>
    <Text style={styles.fieldLabel}>Durum</Text>
    <View style={styles.statusGrid}>
      {STATUS_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.statusOption, isSelected && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
            onPress={() => onSelect(opt.value)}
          >
            <View style={[styles.statusIconBox, { backgroundColor: opt.color + '20' }]}>
              <MaterialCommunityIcons name={opt.icon} size={22} color={opt.color} />
            </View>
            <Text style={[styles.statusOptionText, isSelected && { color: '#fff' }]}>{opt.label}</Text>
            {isSelected && (
              <MaterialCommunityIcons name="check-circle" size={18} color={opt.color} style={{ position: 'absolute', top: 8, right: 8 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// Marka seçici (arama özellikli dropdown)
const BrandSelector = ({ selected, onSelect, visible, setVisible }) => {
  const [brandSearch, setBrandSearch] = useState('');
  const filteredBrands = BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <View style={styles.chipField}>
      <Text style={styles.fieldLabel}>Marka</Text>
      <TouchableOpacity 
        style={styles.dropdownTrigger} 
        onPress={() => setVisible(!visible)}
      >
        <Text style={[styles.dropdownTriggerText, selected && { color: '#fff' }]}>
          {selected || 'Marka seçin...'}
        </Text>
        <MaterialCommunityIcons 
          name={visible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="rgba(255,255,255,0.4)" 
        />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownPanel}>
          <View style={styles.dropdownSearch}>
            <Ionicons name="search" size={14} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={styles.dropdownSearchInput}
              placeholder="Marka ara..."
              placeholderTextColor="#444"
              value={brandSearch}
              onChangeText={setBrandSearch}
              {...Platform.select({ web: { outlineStyle: 'none' } })}
            />
          </View>
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {filteredBrands.map((brand) => {
              const isSelected = selected === brand;
              return (
                <TouchableOpacity
                  key={brand}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                  onPress={() => { onSelect(brand); setVisible(false); setBrandSearch(''); }}
                >
                  <Text style={[styles.dropdownItemText, isSelected && { color: '#fff' }]}>{brand}</Text>
                  {isSelected && <MaterialCommunityIcons name="check" size={16} color={THEME.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};


export default function AssetsScreen() {
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Modal durumları
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); // null = yeni, object = düzenleme
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    assignedUser: '',
    status: 'Depoda',
  });

  // Detay/aksiyonlar için genişletilmiş kart
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('userInfo');
      let currentUser = null;
      if (stored) {
        currentUser = JSON.parse(stored);
        setUserInfo(currentUser);
      }

      const response = await axios.get(`${BACKEND_URL}/api/assets`);
      setAssets(response.data);
    } catch (error) {
      console.log('Varlıklar çekilemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssets();
  }, [fetchAssets]);

  // Formu sıfırla
  const resetForm = () => {
    setFormData({ type: '', brand: '', model: '', serialNumber: '', assignedUser: '', status: 'Depoda' });
    setEditingAsset(null);
    setBrandDropdownOpen(false);
  };

  // Yeni ekleme modalı aç
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Düzenleme modalı aç
  const openEditModal = (asset) => {
    // modelName'den marka ve modeli ayır
    const parts = (asset.modelName || '').split(' ');
    const brand = BRANDS.includes(parts[0]) ? parts[0] : 'Diğer';
    const model = BRANDS.includes(parts[0]) ? parts.slice(1).join(' ') : asset.modelName;
    
    setFormData({
      type: asset.type || '',
      brand: brand,
      model: model,
      serialNumber: asset.serialNumber || '',
      assignedUser: asset.assignedUser || '',
      status: asset.status || 'Depoda',
    });
    setEditingAsset(asset);
    setExpandedCard(null);
    setModalVisible(true);
  };

  // Kaydet (yeni veya güncelleme)
  const handleSave = async () => {
    if (!formData.type) {
      Alert.alert('Uyarı', 'Lütfen cihaz türünü seçin.');
      return;
    }
    if (!formData.brand) {
      Alert.alert('Uyarı', 'Lütfen bir marka seçin.');
      return;
    }
    if (!formData.serialNumber.trim()) {
      Alert.alert('Uyarı', 'Seri numarası zorunludur.');
      return;
    }

    const modelName = formData.model.trim() 
      ? `${formData.brand} ${formData.model.trim()}`
      : formData.brand;

    const payload = {
      type: formData.type,
      modelName,
      serialNumber: formData.serialNumber.trim(),
      assignedUser: formData.status === 'Depoda' ? 'Depoda' : (formData.assignedUser.trim() || 'Belirtilmedi'),
      status: formData.status,
    };

    try {
      setSaving(true);
      if (editingAsset) {
        // Güncelleme
        await axios.put(`${BACKEND_URL}/api/assets/${editingAsset._id}`, payload);
        Alert.alert('Başarılı', 'Varlık güncellendi.');
      } else {
        // Yeni oluşturma
        await axios.post(`${BACKEND_URL}/api/assets`, payload);
        Alert.alert('Başarılı', 'Varlık kaydedildi.');
      }
      setModalVisible(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setSaving(false);
    }
  };

  // Silme
  const handleDelete = (assetId) => {
    Alert.alert(
      'Varlığı Sil',
      'Bu varlık kaydını kalıcı olarak silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/assets/${assetId}`);
              setAssets(prev => prev.filter(a => a._id !== assetId));
              setExpandedCard(null);
              Alert.alert('Başarılı', 'Varlık silindi.');
            } catch (error) {
              Alert.alert('Hata', 'Varlık silinemedi.');
            }
          }
        }
      ]
    );
  };

  // Arama filtreleme
  const filteredAssets = assets.filter(item => {
    // Eğer role USER ise sadece kendisine zimmetli olanları görebilir
    if (userInfo && userInfo.role === 'USER' && item.assignedUser !== userInfo.name) {
      return false;
    }

    const q = search.toLowerCase();
    const modelName = (item.modelName || '').toLowerCase();
    const assignedName = (item.assignedUser || '').toLowerCase();
    const serialNumber = (item.serialNumber || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    const status = (item.status || '').toLowerCase();
    return modelName.includes(q) || assignedName.includes(q) || serialNumber.includes(q) || type.includes(q) || status.includes(q);
  });

  // Durum istatistikleri
  const statusCounts = {
    zimmetli: assets.filter(a => a.status === 'Zimmetli').length,
    depoda: assets.filter(a => a.status === 'Depoda').length,
    arizali: assets.filter(a => a.status === 'Arızalı').length,
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Varlık Yönetimi</Text>
          <Text style={styles.subTitle}>{filteredAssets.length} Kayıtlı Varlık</Text>
        </View>
        {userInfo?.role !== 'USER' && (
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <LinearGradient colors={THEME.buttonGrad} style={styles.addBtnGradient}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Yeni Ekle</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* DURUM ÖZET KARTLARI */}
      <View style={styles.statsRow}>
        <View style={[styles.miniStat, { borderColor: THEME.accent + '30' }]}>
          <MaterialCommunityIcons name="account-check" size={16} color={THEME.accent} />
          <Text style={styles.miniStatValue}>{statusCounts.zimmetli}</Text>
          <Text style={styles.miniStatLabel}>Zimmetli</Text>
        </View>
        <View style={[styles.miniStat, { borderColor: THEME.success + '30' }]}>
          <MaterialCommunityIcons name="warehouse" size={16} color={THEME.success} />
          <Text style={styles.miniStatValue}>{statusCounts.depoda}</Text>
          <Text style={styles.miniStatLabel}>Depoda</Text>
        </View>
        <View style={[styles.miniStat, { borderColor: THEME.danger + '30' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={THEME.danger} />
          <Text style={styles.miniStatValue}>{statusCounts.arizali}</Text>
          <Text style={styles.miniStatLabel}>Arızalı</Text>
        </View>
      </View>

      {/* ARAMA */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.3)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cihaz, kullanıcı veya seri no ara..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
          {...Platform.select({ web: { outlineStyle: 'none' } })}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Varlıklar yükleniyor...</Text>
        </View>
      ) : filteredAssets.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="database-outline" size={60} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 15, fontSize: 15 }}>
            {search ? 'Aramayla eşleşen varlık bulunamadı' : 'Henüz varlık bulunmuyor'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accent} />
          }
        >
          {filteredAssets.map((item) => {
            const typeInfo = getTypeInfo(item.type);
            const statusInfo = getStatusInfo(item.status);
            const isExpanded = expandedCard === item._id;

            return (
              <TouchableOpacity 
                key={item._id} 
                style={[styles.card, isExpanded && styles.cardExpanded]}
                onPress={() => setExpandedCard(isExpanded ? null : item._id)}
                activeOpacity={0.85}
              >
                {/* Kart Üst */}
                <View style={styles.cardTop}>
                  <View style={styles.cardTypeRow}>
                    <View style={[styles.typeIconBox, { backgroundColor: THEME.accent + '15' }]}>
                      <MaterialCommunityIcons name={typeInfo.icon} size={18} color={THEME.accent} />
                    </View>
                    <Text style={styles.typeText}>{typeInfo.label}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18' }]}>
                    <MaterialCommunityIcons name={statusInfo.icon} size={12} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{item.status}</Text>
                  </View>
                </View>

                {/* Model adı */}
                <Text style={styles.modelText}>{item.modelName}</Text>

                {/* Bilgi satırı */}
                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Seri No</Text>
                    <Text style={styles.infoValue}>{item.serialNumber}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Kullanıcı</Text>
                    <Text style={styles.infoValue}>{item.assignedUser || 'Depoda'}</Text>
                  </View>
                </View>

                {/* Genişletilmiş alan - düzenle/sil butonları */}
                {isExpanded && (
                  <View style={styles.cardActions}>
                    <View style={styles.cardActionsDivider} />
                    
                    {/* Oluşturulma tarihi */}
                    {item.createdAt && (
                      <View style={styles.dateRow}>
                        <MaterialCommunityIcons name="calendar-outline" size={13} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.dateText}>
                          Kayıt: {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                    )}

                    {userInfo?.role !== 'USER' && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.editBtn}
                          onPress={() => openEditModal(item)}
                        >
                          <MaterialCommunityIcons name="pencil-outline" size={16} color={THEME.accent} />
                          <Text style={styles.editBtnText}>Düzenle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteBtn}
                          onPress={() => handleDelete(item._id)}
                        >
                          <MaterialCommunityIcons name="delete-outline" size={16} color="#ff6b6b" />
                          <Text style={styles.deleteBtnText}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ===== VARLIK EKLEME / DÜZENLEME MODAL ===== */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={modalVisible} 
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons 
                  name={editingAsset ? "pencil-box-outline" : "plus-box-outline"} 
                  size={22} 
                  color={THEME.accent} 
                />
                <Text style={styles.modalTitle}>
                  {editingAsset ? 'Varlık Düzenle' : 'Yeni Varlık Kaydı'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {/* CİHAZ TÜRÜ SEÇİCİ */}
              <ChipSelector
                label="Cihaz Türü"
                options={DEVICE_TYPES}
                selected={formData.type}
                onSelect={(val) => setFormData({...formData, type: val})}
              />

              {/* MARKA SEÇİCİ */}
              <BrandSelector
                selected={formData.brand}
                onSelect={(val) => setFormData({...formData, brand: val})}
                visible={brandDropdownOpen}
                setVisible={setBrandDropdownOpen}
              />

              {/* MODEL */}
              <View style={styles.chipField}>
                <Text style={styles.fieldLabel}>Model</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Model adı (örn: MacBook Pro 14)"
                  placeholderTextColor="#555"
                  value={formData.model}
                  onChangeText={(text) => setFormData({...formData, model: text})}
                  {...Platform.select({ web: { outlineStyle: 'none' } })}
                />
              </View>

              {/* SERİ NUMARASI */}
              <View style={styles.chipField}>
                <Text style={styles.fieldLabel}>Seri Numarası *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seri numarasını girin"
                  placeholderTextColor="#555"
                  value={formData.serialNumber}
                  onChangeText={(text) => setFormData({...formData, serialNumber: text})}
                  {...Platform.select({ web: { outlineStyle: 'none' } })}
                />
              </View>

              {/* DURUM SEÇİCİ */}
              <StatusSelector
                selected={formData.status}
                onSelect={(val) => setFormData({...formData, status: val})}
              />

              {/* KULLLANICI ADI (sadece Zimmetli veya Arızalı ise) */}
              {formData.status !== 'Depoda' && (
                <View style={styles.chipField}>
                  <Text style={styles.fieldLabel}>
                    {formData.status === 'Zimmetli' ? 'Zimmetli Kişi' : 'Son Kullanan Kişi'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Kişi adını girin"
                    placeholderTextColor="#555"
                    value={formData.assignedUser}
                    onChangeText={(text) => setFormData({...formData, assignedUser: text})}
                    {...Platform.select({ web: { outlineStyle: 'none' } })}
                  />
                </View>
              )}

              {/* KAYDET BUTONU */}
              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient 
                  colors={editingAsset ? THEME.orangeGrad : THEME.buttonGrad} 
                  style={styles.saveBtnGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons 
                        name={editingAsset ? "content-save-edit" : "content-save-outline"} 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={styles.saveBtnText}>
                        {editingAsset ? 'Güncelle' : 'Kaydet'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', padding: 20, paddingTop: 10 
  },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  addBtn: { borderRadius: 12, overflow: 'hidden' },
  addBtnGradient: { 
    flexDirection: 'row', paddingVertical: 10, 
    paddingHorizontal: 16, alignItems: 'center', gap: 5 
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Durum istatistikleri
  statsRow: { 
    flexDirection: 'row', paddingHorizontal: 20, 
    marginBottom: 15, gap: 10 
  },
  miniStat: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    backgroundColor: THEME.card, borderRadius: 12, 
    paddingVertical: 10, paddingHorizontal: 10, gap: 6,
    borderWidth: 1 
  },
  miniStatValue: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  miniStatLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },

  // Arama
  searchContainer: { 
    flexDirection: 'row', backgroundColor: THEME.card, 
    marginHorizontal: 20, padding: 12, borderRadius: 15, 
    alignItems: 'center', borderWidth: 1, borderColor: THEME.border 
  },
  searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 15 },

  // Liste
  list: { padding: 20, paddingBottom: 120 },

  // Kart
  card: { 
    backgroundColor: THEME.card, borderRadius: 20, padding: 18, 
    marginBottom: 12, borderWidth: 1, borderColor: THEME.border 
  },
  cardExpanded: { borderColor: 'rgba(162, 155, 254, 0.3)' },
  cardTop: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 12 
  },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeIconBox: { 
    width: 30, height: 30, borderRadius: 8, 
    justifyContent: 'center', alignItems: 'center' 
  },
  typeText: { color: THEME.accent, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  statusBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 
  },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  modelText: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoCol: { flex: 1 },
  infoLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 },
  infoValue: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Kart Aksiyonları
  cardActions: { marginTop: 12 },
  cardActionsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  dateRow: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 
  },
  dateText: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  editBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 6, backgroundColor: 'rgba(162, 155, 254, 0.1)', borderRadius: 12, 
    paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(162, 155, 254, 0.25)' 
  },
  editBtnText: { color: THEME.accent, fontWeight: '600', fontSize: 13 },
  deleteBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 6, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 12, 
    paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.25)' 
  },
  deleteBtnText: { color: '#ff6b6b', fontWeight: '600', fontSize: 13 },

  // Modal
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, padding: 20, maxHeight: '90%',
    borderWidth: 1, borderColor: THEME.border 
  },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 20 
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Form field'lar
  chipField: { marginBottom: 18 },
  fieldLabel: { 
    color: 'rgba(255,255,255,0.5)', fontSize: 12, 
    fontWeight: '600', marginBottom: 10, marginLeft: 2 
  },
  input: { 
    backgroundColor: THEME.inputBg, borderRadius: 12, padding: 14, 
    color: '#fff', borderWidth: 1, borderColor: THEME.border, fontSize: 14 
  },

  // Chip seçici
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, 
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  chipSelected: { 
    backgroundColor: THEME.accent + '20', borderColor: THEME.accent + '50' 
  },
  chipText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },

  // Durum seçici
  statusGrid: { flexDirection: 'row', gap: 10 },
  statusOption: { 
    flex: 1, alignItems: 'center', paddingVertical: 14, 
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', 
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' 
  },
  statusIconBox: { 
    width: 40, height: 40, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 8 
  },
  statusOptionText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },

  // Dropdown seçici
  dropdownTrigger: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: THEME.inputBg, borderRadius: 12, padding: 14, 
    borderWidth: 1, borderColor: THEME.border 
  },
  dropdownTriggerText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
  dropdownPanel: { 
    backgroundColor: 'rgba(15,12,41,0.95)', borderRadius: 12, 
    marginTop: 8, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' 
  },
  dropdownSearch: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 12, paddingVertical: 8, 
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  dropdownSearchInput: { flex: 1, color: '#fff', marginLeft: 8, fontSize: 13 },
  dropdownItem: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, 
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' 
  },
  dropdownItemSelected: { backgroundColor: THEME.accent + '10' },
  dropdownItemText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  // Kaydet butonu
  saveBtn: { marginTop: 10, borderRadius: 15, overflow: 'hidden', height: 50 },
  saveBtnGradient: { 
    flex: 1, flexDirection: 'row', justifyContent: 'center', 
    alignItems: 'center', gap: 8 
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});