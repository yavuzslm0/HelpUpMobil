import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, TextInput, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Sidebar = ({ activeTab, setActiveTab }) => {
  const NavItem = ({ label, icon, name }) => (
    <TouchableOpacity 
      style={[styles.navItem, activeTab === name && styles.activeNavItem]}
      onPress={() => setActiveTab(name)}
    >
      <View style={[styles.activeIndicator, { backgroundColor: activeTab === name ? '#a29bfe' : 'transparent' }]} />
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color={activeTab === name ? '#a29bfe' : 'rgba(255, 255, 255, 0.5)'} 
      />
      <Text style={[styles.navText, { color: activeTab === name ? '#fff' : 'rgba(255, 255, 255, 0.5)' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoBox}><Text style={styles.logoIconText}>IT</Text></View>
        <View>
          <Text style={styles.logoTitle}>HelpUP Çözüm</Text>
          <Text style={styles.logoSubTitle}>IT Personel Paneli</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <NavItem label="Anasayfa" icon="home-variant-outline" name="Anasayfa" />
        <NavItem label="Taleplerim" icon="ticket-outline" name="Taleplerim" />
        <NavItem label="Talep Oluştur" icon="plus-circle-outline" name="Talep Oluştur" />
        <NavItem label="Varlık Yönetimi" icon="database-outline" name="Varlık Yönetimi" />
        <NavItem label="Raporlar" icon="chart-bar" name="Raporlar" />
        <NavItem label="SSS / Çözümler" icon="frequently-asked-questions" name="SSS" />

        <View style={styles.sidebarSearchBox}>
          <Ionicons name="search" size={14} color="rgba(255, 255, 255, 0.5)" />
          <TextInput placeholder="Sorun ara..." placeholderTextColor="rgba(255, 255, 255, 0.5)" style={styles.sidebarSearchInput} />
        </View>

        <Text style={styles.sidebarSectionTitle}>POPÜLER KONULAR</Text>
        <View style={styles.tagContainer}>
          {['#WifiSorunu', '#ŞifreSıfırla', '#Yazıcı', '#Outlook', '#VPN', '#MaviEkran'].map(tag => (
            <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: { width: width * 0.25, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRightWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', paddingTop: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 30 },
  logoBox: { width: 35, height: 35, borderRadius: 8, backgroundColor: '#6c5ce7', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoIconText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  logoTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  logoSubTitle: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, marginBottom: 5 },
  activeNavItem: { backgroundColor: 'rgba(162, 155, 254, 0.15)' },
  activeIndicator: { position: 'absolute', left: 0, width: 3, height: '100%' },
  navText: { marginLeft: 12, fontSize: 13 },
  sidebarSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', margin: 15, paddingHorizontal: 10, borderRadius: 8, height: 35 },
  sidebarSearchInput: { flex: 1, color: '#fff', fontSize: 12, marginLeft: 5, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  sidebarSectionTitle: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: 'bold', marginLeft: 15, marginTop: 10 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 5 },
  tag: { backgroundColor: 'rgba(108, 92, 231, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#a29bfe', fontSize: 10 }
});

export default Sidebar;