//screens/DashboardScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Dimensions, Platform, StatusBar, LayoutAnimation, UIManager 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config';

// Dışarıdan çağırdığımız sayfalar
import CreateTicketScreen from './CreateTicketScreen'; 
import TicketsScreen from './TicketsScreen'; 
import AssetsScreen from './AssetsScreen'; 
import ProfileScreen from './ProfileScreen';
import ReportsScreen from './ReportsScreen';

// Android animasyon desteği
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const THEME = {
  bg: ['#0f0c29', '#302b63'],
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  accent: '#a29bfe',
  success: '#2ecc71',
  warning: '#f1c40f',
  danger: '#e74c3c',
  navBg: '#1a1a2e'
};

// --- SSS ACCORDION BİLEŞENİ ---
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <TouchableOpacity 
      style={[styles.faqCard, isOpen && styles.faqCardActive]} 
      onPress={toggleOpen} 
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, isOpen && { color: '#a29bfe' }]}>{question}</Text>
        <MaterialCommunityIcons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={isOpen ? "#a29bfe" : "rgba(255,255,255,0.4)"} 
        />
      </View>
      {isOpen && (
        <View style={styles.faqAnswerContainer}>
          <View style={styles.faqDivider} />
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// İstatistik Kartı Bileşeni
const StatCard = ({ title, value, subText, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusText}>{subText}</Text>
    </View>
  </View>
);

// Tab Menü Elemanı
const TabItem = ({ label, icon, name, activeTab, setActiveTab }) => {
  const isActive = activeTab === name;
  return (
    <TouchableOpacity 
      style={styles.tabItem} 
      onPress={() => setActiveTab(name)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={22} 
        color={isActive ? THEME.accent : 'rgba(255,255,255,0.4)'} 
      />
      <Text style={[styles.tabLabel, { color: isActive ? THEME.accent : 'rgba(255,255,255,0.4)' }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function DashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Anasayfa');
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({ openTickets: 0, closedTickets: 0, avgResolutionHours: 0, categoryStats: [], recentTickets: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Kullanıcı bilgilerini AsyncStorage'dan al
      const storedUser = await AsyncStorage.getItem('userInfo');
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
      }

      // İstatistikleri backend'den çek
      const response = await axios.get(`${BACKEND_URL}/api/tickets/stats`);
      setStats(response.data);
    } catch (error) {
      console.log('Dashboard veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve Anasayfa sekmesine her geçtiğinde verileri çek
  React.useEffect(() => {
    if (activeTab === 'Anasayfa') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const userName = userInfo?.name || 'Kullanıcı';
  const userRole = userInfo?.role || 'USER';
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Öncelik rengini belirle
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Kritik': return '#e74c3c';
      case 'Yüksek': return '#e74c3c';
      case 'Orta': return '#f39c12';
      case 'Düşük': return '#2ecc71';
      default: return '#a29bfe';
    }
  };

  // Durum badge rengini belirle
  const getStatusColor = (status) => {
    switch (status) {
      case 'Onay Bekliyor': return '#f1c40f';
      case 'Onaylandı': return '#6366f1';
      case 'İşlemde': return '#e67e22';
      case 'Çözüldü': return '#2ecc71';
      case 'Reddedildi': return '#e74c3c';
      default: return THEME.accent;
    }
  };

  // Grafik çubukları için max değeri bul
  const maxBarValue = Math.max(...(stats.categoryStats || []).map(c => c.open + c.closed), 1);

  const renderContent = () => {
    switch (activeTab) {
      case 'Anasayfa':
        if (userRole === 'USER') {
          return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
              <View style={styles.userWelcomeCard}>
                <View style={styles.userWelcomeIconBox}>
                  <MaterialCommunityIcons name="hand-wave" size={40} color={THEME.accent} />
                </View>
                <Text style={styles.userWelcomeTitle}>Merhaba, {userName}!</Text>
                <Text style={styles.userWelcomeText}>
                  HelpUP sistemine hoş geldiniz. Buradan karşılaştığınız teknik sorunlar için destek talebi oluşturabilir veya size zimmetli cihazları görüntüleyebilirsiniz.
                </Text>
                
                <View style={styles.userActionRow}>
                  <TouchableOpacity 
                    style={[styles.userActionBtn, { backgroundColor: THEME.accent + '20', borderColor: THEME.accent + '50' }]}
                    onPress={() => setActiveTab('Talep Oluştur')}
                  >
                    <MaterialCommunityIcons name="plus-circle" size={24} color={THEME.accent} />
                    <Text style={[styles.userActionBtnText, { color: THEME.accent }]}>Yeni Talep</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.userActionBtn, { backgroundColor: THEME.success + '20', borderColor: THEME.success + '50' }]}
                    onPress={() => setActiveTab('Taleplerim')}
                  >
                    <MaterialCommunityIcons name="ticket-confirmation" size={24} color={THEME.success} />
                    <Text style={[styles.userActionBtnText, { color: THEME.success }]}>Taleplerim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          );
        }

        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <Text style={styles.sectionTitle}>HelpUP Çözüm Paneli</Text>
            <View style={styles.statGrid}>
              <StatCard title="Açık Talep" value={String(stats.openTickets)} subText="Canlı" icon="ticket-confirmation-outline" color={THEME.accent} />
              <StatCard title="Ort. Çözüm" value={`${stats.avgResolutionHours} Sa`} subText="Bugün" icon="clock-check-outline" color={THEME.success} />
              <StatCard title="Kapatılan" value={String(stats.closedTickets)} subText="Toplam" icon="check-circle-outline" color={THEME.warning} />
            </View>
            
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Talep Durum Dağılımı</Text>
              <View style={styles.dummyChart}>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#a29bfe'}]} /><Text style={styles.legendText}>Açık</Text></View>
                  <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#2ecc71'}]} /><Text style={styles.legendText}>Çözüldü</Text></View>
                </View>
                <View style={styles.barContainer}>
                  {(stats.categoryStats || []).length > 0 ? (
                    [...stats.categoryStats].sort((a, b) => (a._id || '').localeCompare(b._id || '')).map((cat, index) => {
                      const colors = ['#a29bfe', '#2ecc71', '#e74c3c', '#f1c40f', '#e67e22', '#9b59b6'];
                      const barHeight = Math.max(((cat.open + cat.closed) / maxBarValue) * 120, 10);
                      return (
                        <View key={cat._id || index} style={{ alignItems: 'center' }}>
                          <View style={[styles.bar, { height: barHeight, backgroundColor: colors[index % colors.length] }]} />
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, marginTop: 4 }} numberOfLines={1}>
                            {(cat._id || '').substring(0, 8)}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Henüz veri yok</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.tableCard}>
              <Text style={styles.chartTitle}>Son Aktif Talepler</Text>
              {(stats.recentTickets || []).length > 0 ? (
                stats.recentTickets.map((ticket, i) => (
                  <View key={ticket._id || i} style={styles.tableRow}>
                    <Text style={[styles.rowText, {flex: 2}]}>{ticket.category}</Text>
                    <Text style={[styles.rowText, {flex: 1, color: getPriorityColor(ticket.priority)}]}>{ticket.priority}</Text>
                    <View style={[styles.statusBadge, {flex: 1, backgroundColor: getStatusColor(ticket.status) + '30'}]}>
                      <Text style={[styles.statusBadgeText, {color: getStatusColor(ticket.status)}]}>{ticket.status}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>Henüz aktif talep yok</Text>
              )}
            </View>
          </ScrollView>
        );
      
      case 'Taleplerim':
        return TicketsScreen ? <TicketsScreen /> : <View style={styles.centered}><Text style={{color:'#fff'}}>TicketsScreen Bulunamadı</Text></View>;
      
      case 'Talep Oluştur':
        return CreateTicketScreen ? <CreateTicketScreen /> : <View style={styles.centered}><Text style={{color:'#fff'}}>CreateTicketScreen Bulunamadı</Text></View>;
      
      case 'Varlık Yönetimi':
        return AssetsScreen ? <AssetsScreen /> : <View style={styles.centered}><Text style={{color:'#fff'}}>AssetsScreen Bulunamadı</Text></View>;

      case 'SSS':
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <View style={styles.faqTopSection}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={40} color="#f1c40f" />
              <Text style={styles.sectionTitle}>Sıkça Sorulan Sorular</Text>
              <Text style={styles.subTitle}>Karşılaştığınız sorunların %90'ı için çözümler aşağıdadır.</Text>
            </View>
            
            <FAQItem question="Bilgisayarım çok yavaş çalışıyor, ne yapmalıyım?" answer="Öncelikle Görev Yöneticisi'ni (Ctrl+Shift+Esc) açarak işlemciyi en çok yoran uygulamaları kontrol edin. Arka planda çalışan gereksiz programları sonlandırın. Ayrıca 'Disk Temizleme' aracını kullanarak geçici sistem dosyalarını silebilir ve bilgisayarınızı yeniden başlatarak önbelleği boşaltabilirsiniz." />
            <FAQItem question="Wi-Fi ağına bağlanamıyorum veya sürekli kopuyor" answer="Cihazınızın Wi-Fi özelliğini kapatıp 10 saniye bekledikten sonra tekrar açın. Eğer sorun devam ediyorsa kayıtlı ağı 'Unut' diyerek şifreyi tekrar girerek bağlanmayı deneyin." />
            <FAQItem question="Outlook e-postalarım gelmiyor / gitmiyor" answer="Outlook'un alt barında 'Çevrimdışı Çalışıyor' ibaresi olup olmadığını kontrol edin. İnternet bağlantınızın aktif olduğunu teyit edin." />
            <FAQItem question="Yazıcıdan çıktı alamıyorum" answer="Yazıcının açık olduğundan ve kağıt tepsisinin dolu olduğundan emin olun. Yazıcı kuyruğunu kontrol ederek takılı kalmış belgeleri iptal edin." />
            <FAQItem question="VPN bağlantısı kuramıyorum (Evden Çalışma)" answer="VPN istemcinizin güncel olduğundan emin olun. Şirket portalından şifrenizi güncelleyerek tekrar deneyin." />
            <FAQItem question="Mavi ekran (Blue Screen) hatası aldım" answer="Bilgisayarı yeniden başlatın. Hata tekrarlarsa ekrandaki Stop Code fotoğrafını çekip IT birimine iletin." />
            <FAQItem question="Şirket hesabı şifremi unuttum / Hesabım kilitlendi" answer="Şirket self-servis portalını kullanabilir veya amirinize danışarak IT biriminin parolanızı resetlemesini talep edebilirsiniz." />
            <FAQItem question="Monitörümde görüntü yok, ekran siyah" answer="Monitörün güç ışığını ve kablo bağlantılarını (HDMI/DP) kontrol edin. Laptop kullanıyorsanız Fn + Projeksiyon tuşuna basarak ekran modunu seçin." />
          </ScrollView>
        );

      case 'Raporlar':
        return (userRole === 'ADMIN' || userRole === 'MANAGER')
          ? <ReportsScreen />
          : <View style={styles.centered}><Text style={{color: '#fff'}}>Bu sayfaya erişim yetkiniz yok</Text></View>;

      case 'Profil':
        return <ProfileScreen navigation={navigation} />;

      default:
        return <View style={styles.centered}><Text style={{color: '#fff'}}>Erişim Yetkisi Bekleniyor...</Text></View>;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />
      
      <View style={styles.topNavbar}>
        <View>
          <Text style={styles.welcomeText}>Hoş geldin,</Text>
          <Text style={styles.userNameText}>{userName} ({userRole})</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatar} 
          onPress={() => setActiveTab('Profil')}
        >
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      <View style={styles.bottomTabBar}>
        <TabItem label="Ana Sayfa" icon="home-variant" name="Anasayfa" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabItem label="Talepler" icon="ticket-confirmation" name="Taleplerim" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabItem label="Yeni" icon="plus-circle" name="Talep Oluştur" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabItem label="Varlıklar" icon="database" name="Varlık Yönetimi" activeTab={activeTab} setActiveTab={setActiveTab} />
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <TabItem label="Raporlar" icon="chart-bar" name="Raporlar" activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        <TabItem label="SSS" icon="frequently-asked-questions" name="SSS" activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  topNavbar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, height: Platform.OS === 'ios' ? 110 : 80, 
    paddingTop: Platform.OS === 'ios' ? 50 : 30, borderBottomWidth: 1, borderBottomColor: THEME.border 
  },
  welcomeText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  userNameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  mainContent: { flex: 1 },
  scrollInner: { paddingBottom: 100, paddingHorizontal: 15 },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginVertical: 15 },
  
  faqTopSection: { alignItems: 'center', marginBottom: 20 },
  subTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginTop: 5 },
  faqCard: { backgroundColor: THEME.card, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  faqCardActive: { borderColor: THEME.accent, backgroundColor: 'rgba(162, 155, 254, 0.05)' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  faqQuestion: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 10 },
  faqAnswerContainer: { paddingHorizontal: 18, paddingBottom: 18 },
  faqDivider: { height: 1, backgroundColor: THEME.border, marginBottom: 12 },
  faqAnswer: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 },

  statGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  statCard: { width: (width - 50) / 3, backgroundColor: THEME.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: THEME.border, alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  statusText: { color: 'rgba(255,255,255,0.4)', fontSize: 8 },
  statIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  chartContainer: { backgroundColor: THEME.card, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.border, marginBottom: 20 },
  chartTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 15 },
  dummyChart: { height: 160, justifyContent: 'flex-end' },
  barContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  bar: { width: 25, borderRadius: 6 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  tableCard: { backgroundColor: THEME.card, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.border },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.border, paddingBottom: 10, marginBottom: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowText: { color: '#fff', fontSize: 13 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  bottomTabBar: { flexDirection: 'row', height: Platform.OS === 'ios' ? 90 : 70, backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: THEME.border, justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 25 : 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 9, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 300 },
  
  // User Welcome
  userWelcomeCard: { backgroundColor: THEME.card, borderRadius: 25, padding: 30, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  userWelcomeIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(162, 155, 254, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  userWelcomeTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  userWelcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 30 },
  userActionRow: { flexDirection: 'row', gap: 15, width: '100%' },
  userActionBtn: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 15, borderWidth: 1 },
  userActionBtnText: { marginTop: 8, fontWeight: 'bold', fontSize: 13 }
});