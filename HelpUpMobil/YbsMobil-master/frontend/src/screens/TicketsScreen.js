//screens/TicketsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Dimensions, Platform, ActivityIndicator, Modal, TextInput, Alert,
  LayoutAnimation, UIManager, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const THEME = {
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  accent: '#a29bfe',
};

const STATUS_CONFIG = {
  'Onay Bekliyor': { color: '#f1c40f', icon: 'clock-outline', step: 0 },
  'Onaylandı': { color: '#6366f1', icon: 'check-decagram', step: 1 },
  'İşlemde': { color: '#e67e22', icon: 'progress-wrench', step: 2 },
  'Çözüldü': { color: '#2ecc71', icon: 'check-circle', step: 3 },
  'Reddedildi': { color: '#e74c3c', icon: 'close-circle', step: -1 },
};

const PRIORITY_COLORS = {
  'Düşük': '#2ecc71',
  'Orta': '#f1c40f',
  'Yüksek': '#e67e22',
  'Kritik': '#e74c3c',
};

const STATUS_STEPS = ['Onay Bekliyor', 'Onaylandı', 'İşlemde', 'Çözüldü'];

// ============================================
// İLERLEME ÇUBUĞU BİLEŞENİ
// ============================================
const ProgressTracker = ({ currentStatus }) => {
  const config = STATUS_CONFIG[currentStatus];
  const isRejected = currentStatus === 'Reddedildi';
  const currentStep = isRejected ? -1 : (config?.step ?? 0);

  return (
    <View style={styles.progressTracker}>
      <Text style={styles.progressTitle}>Talep Durumu</Text>
      <View style={styles.stepsContainer}>
        {STATUS_STEPS.map((step, index) => {
          const stepConfig = STATUS_CONFIG[step];
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index && !isRejected;
          const isActive = isCompleted || isCurrent;

          return (
            <React.Fragment key={step}>
              {/* Step Çizgisi */}
              {index > 0 && (
                <View style={[styles.stepLine, isCompleted && { backgroundColor: stepConfig.color }]} />
              )}
              {/* Step Dairesi */}
              <View style={styles.stepWrapper}>
                <View style={[
                  styles.stepCircle,
                  isActive && { backgroundColor: stepConfig.color + '30', borderColor: stepConfig.color },
                  isCurrent && { borderWidth: 2.5, shadowColor: stepConfig.color, shadowOpacity: 0.5, shadowRadius: 8 }
                ]}>
                  <MaterialCommunityIcons
                    name={isCompleted ? 'check' : stepConfig.icon}
                    size={16}
                    color={isActive ? stepConfig.color : 'rgba(255,255,255,0.2)'}
                  />
                </View>
                <Text style={[styles.stepLabel, isActive && { color: stepConfig.color }]} numberOfLines={1}>
                  {step}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      {isRejected && (
        <View style={styles.rejectedBanner}>
          <MaterialCommunityIcons name="close-circle" size={16} color="#e74c3c" />
          <Text style={styles.rejectedText}>Bu talep reddedildi</Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// TALEP DETAY MODALI
// ============================================
const TicketDetailModal = ({ ticket, visible, onClose, isManager, admins, onRefresh }) => {
  const [approveNote, setApproveNote] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!ticket) return null;

  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['Onay Bekliyor'];
  const priorityColor = PRIORITY_COLORS[ticket.priority] || '#a29bfe';

  const handleApprove = async () => {
    if (!selectedAdmin) {
      Alert.alert('Uyarı', 'Lütfen bir IT personeli seçin');
      return;
    }
    try {
      setProcessing(true);
      await axios.put(`${BACKEND_URL}/api/tickets/${ticket._id}/approve`, {
        assigneeId: selectedAdmin,
        managerNote: approveNote,
      });
      setShowApproveForm(false);
      setApproveNote('');
      setSelectedAdmin('');
      onRefresh();
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Onaylama işlemi başarısız');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      await axios.put(`${BACKEND_URL}/api/tickets/${ticket._id}/reject`, {
        managerNote: rejectNote,
      });
      setShowRejectForm(false);
      setRejectNote('');
      onRefresh();
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Reddetme işlemi başarısız');
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setProcessing(true);
      await axios.put(`${BACKEND_URL}/api/tickets/${ticket._id}/status`, {
        status: newStatus,
      });
      onRefresh();
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenemedi');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTicketId}>{ticket.ticketId}</Text>
                <Text style={styles.modalTitle}>{ticket.category}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* Status & Priority Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: statusConfig.color + '20' }]}>
                <MaterialCommunityIcons name={statusConfig.icon} size={14} color={statusConfig.color} />
                <Text style={[styles.badgeText, { color: statusConfig.color }]}>{ticket.status}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={priorityColor} />
                <Text style={[styles.badgeText, { color: priorityColor }]}>{ticket.priority}</Text>
              </View>
            </View>

            {/* İlerleme Çubuğu */}
            <ProgressTracker currentStatus={ticket.status} />

            {/* Detay Bilgileri */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Detay Bilgileri</Text>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="account" size={18} color={THEME.accent} />
                <Text style={styles.detailLabel}>Oluşturan:</Text>
                <Text style={styles.detailValue}>{ticket.creator?.name || '-'}</Text>
              </View>

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="account-cog" size={18} color="#e67e22" />
                <Text style={styles.detailLabel}>Atanan IT:</Text>
                <Text style={[styles.detailValue, !ticket.assignee && { color: '#e74c3c' }]}>
                  {ticket.assignee?.name || 'Henüz atanmadı'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar" size={18} color="#2ecc71" />
                <Text style={styles.detailLabel}>Tarih:</Text>
                <Text style={styles.detailValue}>
                  {new Date(ticket.createdAt).toLocaleDateString('tr-TR', { 
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>

            {/* Açıklama */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>Açıklama</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{ticket.description || 'Açıklama yok'}</Text>
              </View>
            </View>

            {/* Fotoğraf */}
            {ticket.photo && ticket.photo.data ? (
              <View style={styles.photoSection}>
                <Text style={styles.sectionLabel}>Eklenen Fotoğraf</Text>
                <View style={styles.photoBox}>
                  <Image
                    source={{ uri: `data:${ticket.photo.mimeType || 'image/jpeg'};base64,${ticket.photo.data}` }}
                    style={styles.photoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : null}

            {/* Manager Notu */}
            {ticket.managerNote ? (
              <View style={styles.managerNoteSection}>
                <Text style={styles.sectionLabel}>Manager Notu</Text>
                <View style={styles.managerNoteBox}>
                  <MaterialCommunityIcons name="comment-account" size={16} color="#f1c40f" />
                  <Text style={styles.managerNoteText}>{ticket.managerNote}</Text>
                </View>
              </View>
            ) : null}

            {/* ==========================================
                MANAGER AKSİYONLARI
                ========================================== */}
            {isManager && ticket.status === 'Onay Bekliyor' && (
              <View style={styles.managerActions}>
                <Text style={styles.sectionLabel}>Manager Aksiyonları</Text>

                {!showApproveForm && !showRejectForm && (
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={[styles.managerBtn, { backgroundColor: 'rgba(46,204,113,0.15)', borderColor: 'rgba(46,204,113,0.3)' }]}
                      onPress={() => setShowApproveForm(true)}
                    >
                      <MaterialCommunityIcons name="check-decagram" size={20} color="#2ecc71" />
                      <Text style={[styles.managerBtnText, { color: '#2ecc71' }]}>Onayla & Ata</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.managerBtn, { backgroundColor: 'rgba(231,76,60,0.15)', borderColor: 'rgba(231,76,60,0.3)' }]}
                      onPress={() => setShowRejectForm(true)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={20} color="#e74c3c" />
                      <Text style={[styles.managerBtnText, { color: '#e74c3c' }]}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Onaylama Formu */}
                {showApproveForm && (
                  <View style={styles.approveForm}>
                    <Text style={styles.formLabel}>IT Personeli Seçin *</Text>
                    <View style={styles.adminList}>
                      {admins.filter(a => a.role === 'ADMIN').map((admin) => (
                        <TouchableOpacity
                          key={admin._id}
                          style={[styles.adminOption, selectedAdmin === admin._id && styles.adminOptionActive]}
                          onPress={() => setSelectedAdmin(admin._id)}
                        >
                          <View style={styles.adminAvatar}>
                            <Text style={styles.adminAvatarText}>{admin.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <Text style={[styles.adminName, selectedAdmin === admin._id && { color: '#fff' }]}>{admin.name}</Text>
                          {selectedAdmin === admin._id && (
                            <MaterialCommunityIcons name="check-circle" size={16} color="#2ecc71" style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.formLabel}>Not (İsteğe Bağlı)</Text>
                    <TextInput
                      style={styles.noteInput}
                      value={approveNote}
                      onChangeText={setApproveNote}
                      placeholder="Personele not bırakın..."
                      placeholderTextColor="#555"
                      multiline
                    />

                    <View style={styles.formBtnRow}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowApproveForm(false)}>
                        <Text style={styles.cancelBtnText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleApprove} disabled={processing}>
                        <LinearGradient colors={['#00b894', '#00cec9']} style={styles.confirmBtn}>
                          {processing ? <ActivityIndicator color="#fff" size="small" /> : (
                            <>
                              <MaterialCommunityIcons name="check" size={18} color="#fff" />
                              <Text style={styles.confirmBtnText}>Onayla</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Reddetme Formu */}
                {showRejectForm && (
                  <View style={styles.approveForm}>
                    <Text style={styles.formLabel}>Red Sebebi</Text>
                    <TextInput
                      style={styles.noteInput}
                      value={rejectNote}
                      onChangeText={setRejectNote}
                      placeholder="Red sebebini belirtin..."
                      placeholderTextColor="#555"
                      multiline
                    />
                    <View style={styles.formBtnRow}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRejectForm(false)}>
                        <Text style={styles.cancelBtnText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleReject} disabled={processing}>
                        <LinearGradient colors={['#e74c3c', '#c0392b']} style={styles.confirmBtn}>
                          {processing ? <ActivityIndicator color="#fff" size="small" /> : (
                            <>
                              <MaterialCommunityIcons name="close" size={18} color="#fff" />
                              <Text style={styles.confirmBtnText}>Reddet</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ==========================================
                ADMIN / IT PERSONELİ AKSİYONLARI
                ========================================== */}
            {ticket.status === 'Onaylandı' && (userInfo?.role === 'ADMIN' || userInfo?.role === 'MANAGER') && (
              <View style={styles.managerActions}>
                <Text style={styles.sectionLabel}>Durumu Güncelle</Text>
                <TouchableOpacity onPress={() => handleStatusChange('İşlemde')}>
                  <LinearGradient colors={['#e67e22', '#d35400']} style={styles.statusUpdateBtn}>
                    <MaterialCommunityIcons name="progress-wrench" size={18} color="#fff" />
                    <Text style={styles.statusUpdateBtnText}>İşleme Al</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {ticket.status === 'İşlemde' && (userInfo?.role === 'ADMIN' || userInfo?.role === 'MANAGER') && (
              <View style={styles.managerActions}>
                <Text style={styles.sectionLabel}>Durumu Güncelle</Text>
                <TouchableOpacity onPress={() => handleStatusChange('Çözüldü')}>
                  <LinearGradient colors={['#2ecc71', '#27ae60']} style={styles.statusUpdateBtn}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                    <Text style={styles.statusUpdateBtnText}>Çözüldü Olarak İşaretle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// ANA BİLEŞEN: Talepler Listesi
// ============================================
export default function TicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const isManager = userInfo?.role === 'MANAGER';

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('userInfo');
      if (stored) {
        const user = JSON.parse(stored);
        setUserInfo(user);

        // Admin listesini çek (manager için)
        if (user.role === 'MANAGER') {
          try {
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            const adminsRes = await axios.get(`${BACKEND_URL}/api/reports/admins`, authHeader);
            setAdmins(adminsRes.data);
          } catch (e) { console.log('Admin listesi alınamadı'); }
        }
      }

      const response = await axios.get(`${BACKEND_URL}/api/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.log('Talepler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Rol kısıtlaması: USER ise sadece kendi oluşturduğu talepleri görsün
  const baseTickets = userInfo?.role === 'USER' 
    ? tickets.filter(t => t.creator?._id === userInfo?._id || t.creator === userInfo?._id)
    : tickets;

  // Filtrele
  const filteredTickets = filterStatus === 'all'
    ? baseTickets
    : filterStatus === 'assigned_to_me'
      ? baseTickets.filter(t => t.assignee?._id === userInfo?._id || t.assignee === userInfo?._id)
      : baseTickets.filter(t => t.status === filterStatus);

  // Durum sayıları
  const statusCounts = {
    all: baseTickets.length,
    'assigned_to_me': baseTickets.filter(t => t.assignee?._id === userInfo?._id || t.assignee === userInfo?._id).length,
    'Onay Bekliyor': baseTickets.filter(t => t.status === 'Onay Bekliyor').length,
    'Onaylandı': baseTickets.filter(t => t.status === 'Onaylandı').length,
    'İşlemde': baseTickets.filter(t => t.status === 'İşlemde').length,
    'Çözüldü': baseTickets.filter(t => t.status === 'Çözüldü').length,
    'Reddedildi': baseTickets.filter(t => t.status === 'Reddedildi').length,
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>📋 Talepler</Text>
        <Text style={styles.headerSub}>
          {isManager ? 'Tüm talepleri yönetin' : 'Sistemdeki talepler'} ({tickets.length} kayıt)
        </Text>
      </View>

      {/* FİLTRE */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'assigned_to_me', label: '👤 Bana Atanan' },
            { key: 'Onay Bekliyor', label: '⏳ Onay Bekliyor' },
            { key: 'Onaylandı', label: '✅ Onaylandı' },
            { key: 'İşlemde', label: '🔧 İşlemde' },
            { key: 'Çözüldü', label: '✔️ Çözüldü' },
            { key: 'Reddedildi', label: '❌ Reddedildi' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filterStatus === f.key && styles.filterChipActive]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.filterChipText, filterStatus === f.key && styles.filterChipTextActive]}>
                {f.label} ({statusCounts[f.key] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TALEP LİSTESİ */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loadingText}>Talepler yükleniyor...</Text>
        </View>
      ) : filteredTickets.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="ticket-outline" size={60} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyText}>Bu kategoride talep yok</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          {filteredTickets.map((ticket, index) => {
            const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['Onay Bekliyor'];
            const priorityColor = PRIORITY_COLORS[ticket.priority] || '#a29bfe';
            const dateStr = ticket.createdAt
              ? new Date(ticket.createdAt).toLocaleDateString('tr-TR')
              : '-';

            return (
              <TouchableOpacity
                key={ticket._id || index}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => openTicket(ticket)}
              >
                {/* Kart Üst */}
                <View style={styles.cardHeader}>
                  <Text style={styles.ticketId}>{ticket.ticketId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
                    <MaterialCommunityIcons name={statusCfg.icon} size={10} color={statusCfg.color} />
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{ticket.status}</Text>
                  </View>
                </View>

                {/* Kategori */}
                <Text style={styles.ticketTitle} numberOfLines={2}>{ticket.category}</Text>

                {/* Açıklama Önizleme */}
                {ticket.description && (
                  <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
                )}

                {/* Alt Bilgi */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={12} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.footerText}>{dateStr}</Text>
                  </View>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                  <Text style={[styles.footerText, { color: priorityColor }]}>{ticket.priority}</Text>
                </View>

                {/* Atanan Kişi */}
                <View style={styles.assigneeRow}>
                  <MaterialCommunityIcons name="account-cog-outline" size={12} color="rgba(255,255,255,0.3)" />
                  <Text style={[styles.footerText, !ticket.assignee && { color: '#e74c3c' }]}>
                    {ticket.assignee?.name || 'Atanmadı'}
                  </Text>
                </View>

                {/* Manager için onay bekliyorsa işaret */}
                {isManager && ticket.status === 'Onay Bekliyor' && (
                  <View style={styles.pendingIndicator}>
                    <MaterialCommunityIcons name="bell-ring" size={12} color="#f1c40f" />
                    <Text style={styles.pendingText}>Onayınızı bekliyor</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* TALEP DETAY MODALI */}
      <TicketDetailModal
        ticket={selectedTicket}
        visible={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        isManager={isManager}
        admins={admins}
        onRefresh={fetchTickets}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: 13 },
  emptyText: { color: 'rgba(255,255,255,0.3)', marginTop: 15, fontSize: 14 },

  // Header
  headerArea: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },

  // Filter
  filterContainer: { paddingHorizontal: 15, marginBottom: 10 },
  filterScroll: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: THEME.accent + '25', borderColor: THEME.accent },
  filterChipText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  // List
  listContainer: { paddingHorizontal: 15, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: THEME.card, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: THEME.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketId: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 'bold', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900' },

  ticketTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  ticketDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 10, lineHeight: 16 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },

  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },

  pendingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    backgroundColor: 'rgba(241,196,15,0.1)', paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  pendingText: { color: '#f1c40f', fontSize: 10, fontWeight: '700' },

  // ===================== PROGRESS TRACKER =====================
  progressTracker: { marginVertical: 20 },
  progressTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  stepsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepWrapper: { alignItems: 'center', width: 65 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepLabel: { color: 'rgba(255,255,255,0.25)', fontSize: 8, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  stepLine: { width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: -2 },
  rejectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    marginTop: 12, padding: 8, backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: 8,
  },
  rejectedText: { color: '#e74c3c', fontSize: 12, fontWeight: '700' },

  // ===================== MODAL =====================
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTicketId: { color: THEME.accent, fontSize: 12, fontWeight: 'bold', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  closeBtn: { padding: 4 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // Detail Section
  detailSection: { marginVertical: 12 },
  sectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  detailValue: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Description
  descriptionSection: { marginBottom: 12 },
  descriptionBox: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  descriptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 },

  // Photo Section
  photoSection: { marginBottom: 12 },
  photoBox: {
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(162, 155, 254, 0.2)',
  },
  photoImage: {
    width: '100%', height: 250, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Manager Note
  managerNoteSection: { marginBottom: 12 },
  managerNoteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(241,196,15,0.08)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(241,196,15,0.15)',
  },
  managerNoteText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, flex: 1, lineHeight: 18 },

  // Manager Actions
  managerActions: { marginTop: 10, marginBottom: 16 },
  actionBtnRow: { flexDirection: 'row', gap: 10 },
  managerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  managerBtnText: { fontWeight: 'bold', fontSize: 13 },

  // Approve/Reject Form
  approveForm: { marginTop: 12 },
  formLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8, marginLeft: 4 },
  adminList: { gap: 6, marginBottom: 12 },
  adminOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  adminOptionActive: { borderColor: THEME.accent, backgroundColor: THEME.accent + '10' },
  adminAvatar: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#6c5ce7' + '30',
    justifyContent: 'center', alignItems: 'center',
  },
  adminAvatarText: { color: '#6c5ce7', fontWeight: 'bold', fontSize: 13 },
  adminName: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },

  noteInput: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minHeight: 60,
    textAlignVertical: 'top', marginBottom: 12,
  },

  formBtnRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },

  // Status Update Button
  statusUpdateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  statusUpdateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});