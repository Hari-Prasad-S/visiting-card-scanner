import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList, ContactRecord } from '../types';
import { storageService } from '../services/storageService';

type HistoryNavProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryNavProp>();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const records = await storageService.getContacts();
      setContacts(records);
    } catch (err) {
      console.error('Failed to load contact history:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Contact', 'Are you sure you want to remove this contact from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.removeContact(id);
          loadHistory();
        },
      },
    ]);
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      c.full_name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      c.designation.toLowerCase().includes(q) ||
      c.phone_number.includes(q) ||
      c.email.toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (filterChannel === 'whatsapp') {
      return c.greeting_channel === 'whatsapp';
    }
    if (filterChannel === 'email') {
      return c.greeting_channel === 'email';
    }
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact History</Text>
        <TouchableOpacity
          style={styles.addScanBtn}
          onPress={() => navigation.navigate('Scanner')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, company, phone, email..."
          placeholderTextColor="#94A3B8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Channel Filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterChannel === 'all' && styles.filterChipActive]}
          onPress={() => setFilterChannel('all')}
        >
          <Text
            style={[styles.filterChipText, filterChannel === 'all' && styles.filterChipTextActive]}
          >
            All ({contacts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterChannel === 'whatsapp' && styles.filterChipActive]}
          onPress={() => setFilterChannel('whatsapp')}
        >
          <MaterialCommunityIcons
            name="whatsapp"
            size={14}
            color={filterChannel === 'whatsapp' ? '#FFFFFF' : '#22C55E'}
          />
          <Text
            style={[
              styles.filterChipText,
              filterChannel === 'whatsapp' && styles.filterChipTextActive,
            ]}
          >
            WhatsApp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterChannel === 'email' && styles.filterChipActive]}
          onPress={() => setFilterChannel('email')}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={14}
            color={filterChannel === 'email' ? '#FFFFFF' : '#3B82F6'}
          />
          <Text
            style={[
              styles.filterChipText,
              filterChannel === 'email' && styles.filterChipTextActive,
            ]}
          >
            Email
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="card-search-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No matching contacts</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search or scan a new visiting card.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardItem}
            onPress={() => navigation.navigate('GreetingPreview', { contact: item })}
            activeOpacity={0.7}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>

              <View style={styles.cardMainInfo}>
                <Text style={styles.cardName}>{item.full_name || 'Unnamed Client'}</Text>
                <Text style={styles.cardCompany} numberOfLines={1}>
                  {[item.designation, item.company_name].filter(Boolean).join(' • ') ||
                    'No company info'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => item.id && handleDelete(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactDetailsRow}>
              {item.phone_number ? (
                <View style={styles.detailPill}>
                  <MaterialCommunityIcons name="phone" size={13} color="#2563EB" />
                  <Text style={styles.detailPillText}>{item.phone_number}</Text>
                </View>
              ) : null}

              {item.email ? (
                <View style={styles.detailPill}>
                  <MaterialCommunityIcons name="email-outline" size={13} color="#64748B" />
                  <Text style={styles.detailPillText} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.channelStatusBadge}>
                <MaterialCommunityIcons
                  name={
                    item.greeting_channel === 'whatsapp'
                      ? 'whatsapp'
                      : item.greeting_channel === 'email'
                      ? 'email-outline'
                      : 'clock-outline'
                  }
                  size={14}
                  color={
                    item.greeting_channel === 'whatsapp'
                      ? '#16A34A'
                      : item.greeting_channel === 'email'
                      ? '#2563EB'
                      : '#64748B'
                  }
                />
                <Text style={styles.channelStatusText}>
                  {item.greeting_status === 'sent'
                    ? `Sent via ${item.greeting_channel}`
                    : 'Drafted'}
                </Text>
              </View>

              <Text style={styles.dateText}>{formatDate(item.scan_date)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  addScanBtn: {
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardCompany: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  detailPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  channelStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

