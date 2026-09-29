import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BottomTabs = ({ activeTab, setActiveTab }) => {
  const TabItem = ({ label, icon, name }) => (
    <TouchableOpacity 
      style={styles.tabItem}
      onPress={() => setActiveTab(name)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={24} 
        color={activeTab === name ? '#a29bfe' : 'rgba(255, 255, 255, 0.5)'} 
      />
      <Text style={[styles.tabLabel, { color: activeTab === name ? '#a29bfe' : 'rgba(255, 255, 255, 0.5)' }]}>
        {label}
      </Text>
      {activeTab === name && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabContainer}>
      <TabItem label="Ana Sayfa" icon="home-variant" name="Anasayfa" />
      <TabItem label="Talepler" icon="ticket" name="Taleplerim" />
      <TabItem label="Yeni" icon="plus-circle" name="Talep Oluştur" />
      <TabItem label="Varlık" icon="database" name="Varlık Yönetimi" />
      <TabItem label="Profil" icon="account" name="Profil" />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e3d', // Sidebar'daki o koyu lacivert tonu
    height: 75,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10, // İsimlerin altına biraz boşluk
    position: 'absolute',
    bottom: 0,
    width: width,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a29bfe',
    marginTop: 2,
  }
});

export default BottomTabs;