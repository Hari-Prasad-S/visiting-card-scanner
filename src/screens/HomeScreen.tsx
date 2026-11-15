import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList, ContactRecord } from '../types';
import { storageService } from '../services/storageService';

type HomeScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavProp>();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [recentContacts, setRecentContacts] = useState<ContactRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const count = await storageService.getCount();
      setTotalCount(count);
      const all = await storageService.getContacts();
      setRecentContacts(all.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header / Brand */}
        <View style={styles.header}>
          <View style={styles.brandIconWrapper}>
            <MaterialCommunityIcons name="card-account-details-star" size={32} color="#2563EB" />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>SmartBiz Scanner</Text>
            <Text style={styles.brandSubtitle}>AI Visiting Card & WhatsApp Greeting</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total Contacts Scanned</Text>
          </View>
          <TouchableOpacity
            style={styles.historyLinkBtn}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="history" size={20} color="#2563EB" />
            <Text style={styles.historyLinkText}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action Button: Launch Auto Scanner */}
        <TouchableOpacity
          style={styles.scanPrimaryBtn}
          onPress={() => navigation.navigate('Scanner')}
          activeOpacity={0.85}
        >
          <View style={styles.scanBtnIconRing}>
            <MaterialCommunityIcons name="camera-iris" size={36} color="#FFFFFF" />
          </View>
          <View style={styles.scanBtnTextGroup}>
            <Text style={styles.scanBtnTitle}>Scan Visiting Card</Text>
            <Text style={styles.scanBtnSubtitle}>
              Auto-detects card & prepares WhatsApp draft
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Feature Highlights Banner */}
        <View style={styles.featuresRow}>
          <View style={styles.featurePill}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#EAB308" />
            <Text style={styles.featurePillText}>Auto Frame Detect</Text>
          </View>
          <View style={styles.featurePill}>
            <MaterialCommunityIcons name="whatsapp" size={16} color="#22C55E" />
            <Text style={styles.featurePillText}>WhatsApp First</Text>
          </View>
          <View style={styles.featurePill}>
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color="#6366F1" />
            <Text style={styles.featurePillText}>100% On-Device</Text>
          </View>
        </View>

        {/* Recent Scans Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {recentContacts.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="card-plus-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No cards scanned yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Scan Visiting Card" to automatically capture client details.
              </Text>
            </View>
          ) : (
            recentContacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.recentCard}
                onPress={() => navigation.navigate('GreetingPreview', { contact: c })}
                activeOpacity={0.7}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {c.full_name ? c.full_name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>

                <View style={styles.recentDetails}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {c.full_name || 'Unnamed Contact'}
                  </Text>
                  <Text style={styles.recentCompany} numberOfLines={1}>
                    {[c.designation, c.company_name].filter(Boolean).join(' • ') || 'No company info'}
                  </Text>
                  <Text style={styles.recentPhone} numberOfLines={1}>
                    {c.whatsapp_number || c.phone_number || c.email || 'No contact info'}
                  </Text>
                </View>

                <View style={styles.channelBadge}>
                  <MaterialCommunityIcons
                    name={
                      c.greeting_channel === 'whatsapp'
                        ? 'whatsapp'
                        : c.greeting_channel === 'email'
                        ? 'email-outline'
                        : 'clock-outline'
                    }
                    size={16}
                    color={
                      c.greeting_channel === 'whatsapp'
                        ? '#22C55E'
                        : c.greeting_channel === 'email'
                        ? '#3B82F6'
                        : '#64748B'
                    }
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  brandTextGroup: {
    marginLeft: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    elevation: 1,
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  historyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  historyLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  scanPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  scanBtnIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnTextGroup: {
    flex: 1,
    marginLeft: 16,
  },
  scanBtnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanBtnSubtitle: {
    fontSize: 12,
    color: '#DBEAFE',
    marginTop: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
    gap: 8,
  },
  featurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  recentSection: {
    marginTop: 4,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  recentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  recentCompany: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recentPhone: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  channelBadge: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
});
