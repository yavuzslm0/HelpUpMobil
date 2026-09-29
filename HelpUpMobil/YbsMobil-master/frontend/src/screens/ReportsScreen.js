//screens/ReportsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Dimensions, Alert, ActivityIndicator, RefreshControl, Modal, TextInput, Platform
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
  success: '#2ecc71',
  warning: '#f1c40f',
  danger: '#e74c3c',
  inputBg: 'rgba(0,0,0,0.2)',
  buttonGrad: ['#6366f1', '#a855f7'],
  orangeGrad: ['#f093fb', '#f5576c'],
  greenGrad: ['#11998e', '#38ef7d'],
};

// Rapor tipi ikon ve renk eşleştirmesi
const REPORT_TYPE_MAP = {
  performance: { icon: 'chart-line', color: '#a29bfe', label: 'Performans' },
  ticket_summary: { icon: 'ticket-outline', color: '#f1c40f', label: 'Talep Özeti' },
  asset_report: { icon: 'desktop-classic', color: '#2ecc71', label: 'Varlık Raporu' },
  custom: { icon: 'file-document-outline', color: '#e67e22', label: 'Özel Rapor' },
};

// Yıldız puanı bileşeni
const StarRating = ({ score, size = 14 }) => {
  const stars = [];
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<MaterialCommunityIcons key={i} name="star" size={size} color="#f1c40f" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<MaterialCommunityIcons key={i} name="star-half-full" size={size} color="#f1c40f" />);
    } else {
      stars.push(<MaterialCommunityIcons key={i} name="star-outline" size={size} color="rgba(255,255,255,0.2)" />);
    }
  }
  return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
};

// İlerleme çubuğu bileşeni
const ProgressBar = ({ value, max, color, label }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={[styles.progressValue, { color }]}>{value}/{max}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// Özet istatistik kartı
const SummaryCard = ({ icon, label, value, color, gradColors }) => (
  <View style={styles.summaryCard}>
    <LinearGradient colors={gradColors || [color + '30', color + '10']} style={styles.summaryGrad} />
    <View style={[styles.summaryIconBox, { backgroundColor: color + '25' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  
  // Modal states (Manager için rapor oluşturma)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('userInfo');
      if (storedUser) setUserInfo(JSON.parse(storedUser));

      const response = await axios.get(`${BACKEND_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.log('Rapor çekme hatası:', error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    // Varsayılan dönem olarak şu anki ayı ayarla
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedPeriod(`${y}-${m}`);
  }, [fetchReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  // Admin listesini çek (Manager için)
  const fetchAdmins = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/reports/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.log('Admin listesi hatası:', error.message);
    }
  };

  // Otomatik rapor oluştur
  const handleAutoGenerate = async () => {
    if (!selectedAdmin) {
      Alert.alert('Uyarı', 'Lütfen bir admin seçin.');
      return;
    }
    if (!selectedPeriod || !/^\d{4}-\d{2}$/.test(selectedPeriod)) {
      Alert.alert('Uyarı', 'Geçerli bir dönem girin (örn: 2025-06).');
      return;
    }
    try {
      setCreating(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/reports/auto-generate`, 
        { targetAdminId: selectedAdmin._id, period: selectedPeriod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Başarılı', 'Performans raporu oluşturuldu.');
      setShowCreateModal(false);
      setSelectedAdmin(null);
      fetchReports();
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.message || 'Rapor oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  // Rapor sil
  const handleDeleteReport = (reportId) => {
    Alert.alert(
      'Raporu Sil',
      'Bu raporu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${BACKEND_URL}/api/reports/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setReports(prev => prev.filter(r => r._id !== reportId));
              Alert.alert('Başarılı', 'Rapor silindi.');
            } catch (error) {
              Alert.alert('Hata', 'Rapor silinemedi.');
            }
          }
        }
      ]
    );
  };

  const isManager = userInfo?.role === 'MANAGER';

  // Tarih formatla
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Dönem formatla
  const formatPeriod = (period) => {
    if (!period) return '';
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const [year, month] = period.split('-').map(Number);
    return `${monthNames[month - 1]} ${year}`;
  };

  // Özet istatistikler hesapla
  const summaryStats = {
    totalReports: reports.length,
    avgSatisfaction: reports.length > 0
      ? (reports.reduce((sum, r) => sum + (r.data?.satisfactionScore || 0), 0) / reports.length).toFixed(1)
      : '0',
    totalTicketsResolved: reports.reduce((sum, r) => sum + (r.data?.resolvedTickets || 0), 0),
    avgResolutionTime: reports.length > 0
      ? (reports.reduce((sum, r) => sum + (r.data?.avgResolutionTime || 0), 0) / reports.length).toFixed(1)
      : '0',
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={THEME.accent} size="large" />
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 15, fontSize: 14 }}>Raporlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accent} />
        }
      >
        {/* BAŞLIK */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="chart-box-outline" size={28} color={THEME.accent} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.pageTitle}>Raporlar</Text>
              <Text style={styles.pageSubtitle}>
                {isManager ? 'Performans analiz paneli' : 'Size atanan raporlar'}
              </Text>
            </View>
          </View>
          {isManager && (
            <TouchableOpacity 
              style={styles.createBtn} 
              onPress={() => { fetchAdmins(); setShowCreateModal(true); }}
            >
              <LinearGradient colors={THEME.buttonGrad} style={styles.createBtnGrad}>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={styles.createBtnText}>Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* ÖZET İSTATİSTİKLER */}
        {reports.length > 0 && (
          <View style={styles.summaryGrid}>
            <SummaryCard 
              icon="file-chart-outline" 
              label="Toplam Rapor" 
              value={summaryStats.totalReports} 
              color={THEME.accent}
            />
            <SummaryCard 
              icon="star-outline" 
              label="Ort. Puan" 
              value={summaryStats.avgSatisfaction} 
              color="#f1c40f"
            />
            <SummaryCard 
              icon="check-decagram-outline" 
              label="Çözülen Talep" 
              value={summaryStats.totalTicketsResolved} 
              color={THEME.success}
            />
            <SummaryCard 
              icon="clock-fast" 
              label="Ort. Süre (Sa)" 
              value={summaryStats.avgResolutionTime} 
              color="#e67e22"
            />
          </View>
        )}

        {/* RAPOR LİSTESİ */}
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={64} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyTitle}>Henüz Rapor Yok</Text>
            <Text style={styles.emptySubtitle}>
              {isManager 
                ? 'Yeni bir performans raporu oluşturmak için "Oluştur" butonunu kullanın.'
                : 'Size atanmış bir rapor bulunmamaktadır.'}
            </Text>
          </View>
        ) : (
          reports.map((report) => {
            const typeInfo = REPORT_TYPE_MAP[report.type] || REPORT_TYPE_MAP.custom;
            const isExpanded = expandedReport === report._id;
            const data = report.data || {};
            const resolutionRate = data.totalTickets > 0 
              ? Math.round((data.resolvedTickets / data.totalTickets) * 100) 
              : 0;

            return (
              <TouchableOpacity 
                key={report._id} 
                style={[styles.reportCard, isExpanded && styles.reportCardExpanded]}
                onPress={() => setExpandedReport(isExpanded ? null : report._id)}
                activeOpacity={0.85}
              >
                {/* Kart Üst Gradient */}
                <LinearGradient 
                  colors={[typeInfo.color + '15', 'transparent']} 
                  style={styles.reportCardGrad} 
                />

                {/* Kart Header */}
                <View style={styles.reportHeader}>
                  <View style={[styles.reportTypeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                    <MaterialCommunityIcons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  </View>
                  <View style={styles.reportHeaderInfo}>
                    <Text style={styles.reportTitle} numberOfLines={isExpanded ? 3 : 1}>{report.title}</Text>
                    <View style={styles.reportMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                      </View>
                      <Text style={styles.reportPeriod}>
                        <MaterialCommunityIcons name="calendar-outline" size={11} color="rgba(255,255,255,0.3)" />
                        {' '}{formatPeriod(report.period)}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="rgba(255,255,255,0.4)" 
                  />
                </View>

                {/* Kısa Özet (her zaman görünür) */}
                <View style={styles.reportQuickStats}>
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatValue}>{data.totalTickets || 0}</Text>
                    <Text style={styles.quickStatLabel}>Toplam</Text>
                  </View>
                  <View style={[styles.quickStatDivider]} />
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: THEME.success }]}>{data.resolvedTickets || 0}</Text>
                    <Text style={styles.quickStatLabel}>Çözülen</Text>
                  </View>
                  <View style={[styles.quickStatDivider]} />
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: '#e67e22' }]}>{data.avgResolutionTime || 0} Sa</Text>
                    <Text style={styles.quickStatLabel}>Ort. Süre</Text>
                  </View>
                  <View style={[styles.quickStatDivider]} />
                  <View style={styles.quickStat}>
                    <StarRating score={data.satisfactionScore || 0} size={12} />
                    <Text style={styles.quickStatLabel}>Puan</Text>
                  </View>
                </View>

                {/* Genişletilmiş Detaylar */}
                {isExpanded && (
                  <View style={styles.reportDetails}>
                    <View style={styles.detailDivider} />
                    
                    {/* Çözüm Oranı */}
                    <ProgressBar 
                      value={data.resolvedTickets || 0} 
                      max={data.totalTickets || 0} 
                      color={resolutionRate >= 70 ? THEME.success : resolutionRate >= 40 ? '#f1c40f' : THEME.danger}
                      label={`Çözüm Oranı (%${resolutionRate})`}
                    />

                    {/* Detay Bilgileri */}
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="account-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.detailLabel}>Hedef Admin</Text>
                        <Text style={styles.detailValue}>{report.targetAdmin?.name || '-'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="account-edit-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.detailLabel}>Oluşturan</Text>
                        <Text style={styles.detailValue}>{report.createdBy?.name || '-'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="calendar-check-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.detailLabel}>Oluşturulma</Text>
                        <Text style={styles.detailValue}>{formatDate(report.createdAt)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="shield-check-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.detailLabel}>Durum</Text>
                        <View style={[styles.statusBadge, { 
                          backgroundColor: report.status === 'published' ? THEME.success + '20' : '#f1c40f20' 
                        }]}>
                          <Text style={[styles.statusText, { 
                            color: report.status === 'published' ? THEME.success : '#f1c40f' 
                          }]}>
                            {report.status === 'published' ? 'Yayında' : 'Taslak'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Notlar */}
                    {data.notes ? (
                      <View style={styles.notesBox}>
                        <MaterialCommunityIcons name="note-text-outline" size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.notesText}>{data.notes}</Text>
                      </View>
                    ) : null}

                    {/* Erişim Yetkisi Olan Adminler */}
                    {report.allowedAdmins && report.allowedAdmins.length > 0 && (
                      <View style={styles.allowedSection}>
                        <Text style={styles.allowedTitle}>Erişim Yetkisi</Text>
                        <View style={styles.allowedList}>
                          {report.allowedAdmins.map((admin, idx) => (
                            <View key={admin._id || idx} style={styles.allowedChip}>
                              <MaterialCommunityIcons name="account-circle-outline" size={14} color={THEME.accent} />
                              <Text style={styles.allowedName}>{admin.name || admin.email}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Manager Aksiyonları */}
                    {isManager && (
                      <TouchableOpacity 
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteReport(report._id)}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={16} color="#ff6b6b" />
                        <Text style={styles.deleteBtnText}>Raporu Sil</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* RAPOR OLUŞTURMA MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['rgba(99,102,241,0.15)', 'transparent']} style={styles.modalGrad} />
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={24} color={THEME.accent} />
                <Text style={styles.modalTitle}>Performans Raporu Oluştur</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dönem Seçimi */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>
                  <MaterialCommunityIcons name="calendar-range" size={14} color="rgba(255,255,255,0.5)" />
                  {' '}Dönem (YYYY-AA)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={selectedPeriod}
                  onChangeText={setSelectedPeriod}
                  placeholder="2025-06"
                  placeholderTextColor="#444"
                  {...Platform.select({ web: { outlineStyle: 'none' } })}
                />
              </View>

              {/* Admin Seçimi */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>
                  <MaterialCommunityIcons name="account-group-outline" size={14} color="rgba(255,255,255,0.5)" />
                  {' '}Hedef Admin
                </Text>
                {admins.length === 0 ? (
                  <View style={{ padding: 15, alignItems: 'center' }}>
                    <ActivityIndicator color={THEME.accent} size="small" />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Admin listesi yükleniyor...</Text>
                  </View>
                ) : (
                  <View style={styles.adminGrid}>
                    {admins.map((admin) => {
                      const isSelected = selectedAdmin?._id === admin._id;
                      return (
                        <TouchableOpacity
                          key={admin._id}
                          style={[styles.adminOption, isSelected && styles.adminOptionSelected]}
                          onPress={() => setSelectedAdmin(admin)}
                        >
                          <View style={[styles.adminAvatar, isSelected && { backgroundColor: THEME.accent }]}>
                            <Text style={styles.adminAvatarText}>
                              {admin.name ? admin.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.adminName, isSelected && { color: '#fff' }]}>{admin.name}</Text>
                            <Text style={styles.adminEmail}>{admin.email}</Text>
                          </View>
                          {isSelected && (
                            <MaterialCommunityIcons name="check-circle" size={20} color={THEME.accent} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Oluştur Butonu */}
              <TouchableOpacity 
                style={[styles.generateBtn, creating && { opacity: 0.7 }]} 
                onPress={handleAutoGenerate}
                disabled={creating}
              >
                <LinearGradient colors={THEME.greenGrad} style={styles.generateBtnGrad}>
                  {creating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" />
                      <Text style={styles.generateBtnText}>Otomatik Oluştur</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.modalHint}>
                Seçilen admin'in belirtilen dönemdeki ticket verilerinden otomatik performans raporu oluşturulur.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },

  // Header
  headerSection: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 20, paddingTop: 5 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  pageSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  createBtn: { borderRadius: 12, overflow: 'hidden' },
  createBtnGrad: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 10, paddingHorizontal: 16, gap: 6 
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Özet Grid
  summaryGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', 
    justifyContent: 'space-between', marginBottom: 20, gap: 10 
  },
  summaryCard: { 
    width: (width - 50) / 2, backgroundColor: THEME.card, 
    borderRadius: 18, padding: 15, borderWidth: 1, borderColor: THEME.border,
    alignItems: 'center', overflow: 'hidden'
  },
  summaryGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  summaryIconBox: { 
    width: 42, height: 42, borderRadius: 14, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  summaryValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },

  // Rapor Kartı
  reportCard: { 
    backgroundColor: THEME.card, borderRadius: 20, 
    padding: 16, marginBottom: 12, borderWidth: 1, 
    borderColor: THEME.border, overflow: 'hidden' 
  },
  reportCardExpanded: { borderColor: 'rgba(162, 155, 254, 0.3)' },
  reportCardGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },

  reportHeader: { flexDirection: 'row', alignItems: 'center' },
  reportTypeIcon: { 
    width: 40, height: 40, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  reportHeaderInfo: { flex: 1 },
  reportTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reportMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  reportPeriod: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },

  // Hızlı İstatistikler
  reportQuickStats: { 
    flexDirection: 'row', justifyContent: 'space-around', 
    alignItems: 'center', marginTop: 14, 
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, 
    paddingVertical: 10, paddingHorizontal: 5 
  },
  quickStat: { alignItems: 'center', flex: 1 },
  quickStatValue: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  quickStatLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 3 },
  quickStatDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Detaylar
  reportDetails: { marginTop: 14 },
  detailDivider: { 
    height: 1, backgroundColor: 'rgba(255,255,255,0.08)', 
    marginBottom: 14 
  },

  // İlerleme Çubuğu
  progressContainer: { marginBottom: 14 },
  progressLabelRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    marginBottom: 6 
  },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  progressValue: { fontSize: 12, fontWeight: '600' },
  progressTrack: { 
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 3, overflow: 'hidden' 
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // Detay Grid
  detailGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 
  },
  detailItem: { 
    width: '48%', backgroundColor: 'rgba(0,0,0,0.15)', 
    borderRadius: 12, padding: 10, gap: 4 
  },
  detailLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: '500' },

  // Status Badge
  statusBadge: { 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 8, alignSelf: 'flex-start', marginTop: 2 
  },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Notlar
  notesBox: { 
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, 
    backgroundColor: 'rgba(162, 155, 254, 0.08)', borderRadius: 12, 
    padding: 12, marginBottom: 12 
  },
  notesText: { flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 },

  // Erişim Yetkisi
  allowedSection: { marginBottom: 12 },
  allowedTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8, fontWeight: '600' },
  allowedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allowedChip: { 
    flexDirection: 'row', alignItems: 'center', gap: 5, 
    backgroundColor: 'rgba(162, 155, 254, 0.1)', borderRadius: 10, 
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, 
    borderColor: 'rgba(162, 155, 254, 0.2)' 
  },
  allowedName: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  // Sil Butonu
  deleteBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 6, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 12, 
    paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.25)' 
  },
  deleteBtnText: { color: '#ff6b6b', fontWeight: '600', fontSize: 13 },

  // Boş Durum
  emptyState: { 
    alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 60, paddingHorizontal: 30 
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptySubtitle: { 
    color: 'rgba(255,255,255,0.35)', fontSize: 13, 
    textAlign: 'center', marginTop: 8, lineHeight: 20 
  },

  // Modal
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, padding: 20, maxHeight: '85%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden'
  },
  modalGrad: { ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 20 
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Modal Field
  modalField: { marginBottom: 20 },
  modalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 10 },
  modalInput: { 
    backgroundColor: THEME.inputBg, borderRadius: 12, padding: 14, 
    color: '#fff', borderWidth: 1, borderColor: THEME.border, fontSize: 15 
  },

  // Admin Grid
  adminGrid: { gap: 8 },
  adminOption: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, 
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, 
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' 
  },
  adminOptionSelected: { 
    borderColor: THEME.accent + '50', backgroundColor: THEME.accent + '10' 
  },
  adminAvatar: { 
    width: 36, height: 36, borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  adminAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  adminName: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  adminEmail: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 },

  // Generate Butonu
  generateBtn: { borderRadius: 15, overflow: 'hidden', marginTop: 5 },
  generateBtnGrad: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 15, gap: 10 
  },
  generateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalHint: { 
    color: 'rgba(255,255,255,0.25)', fontSize: 11, 
    textAlign: 'center', marginTop: 15, lineHeight: 18, paddingBottom: 20 
  },
});