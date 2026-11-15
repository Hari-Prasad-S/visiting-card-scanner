import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList, ContactRecord, GreetingChannel } from '../types';
import { GreetingPreview } from '../components/GreetingPreview';
import { storageService } from '../services/storageService';

type GreetingPreviewRouteProp = RouteProp<RootStackParamList, 'GreetingPreview'>;
type GreetingPreviewNavProp = NativeStackNavigationProp<RootStackParamList, 'GreetingPreview'>;

export const GreetingPreviewScreen: React.FC = () => {
  const navigation = useNavigation<GreetingPreviewNavProp>();
  const route = useRoute<GreetingPreviewRouteProp>();

  const contact: ContactRecord = route.params.contact;
  const [senderCompany, setSenderCompany] = useState('Our Company');

  const handleGreetingSent = async (channel: GreetingChannel) => {
    try {
      if (contact.id) {
        await storageService.updateGreeting(contact.id, channel, 'sent');
      }

      Alert.alert(
        'Greeting Dispatched',
        `Client greeting prepared via ${channel === 'whatsapp' ? 'WhatsApp Business' : 'Email'}.`,
        [
          {
            text: 'Scan Next Card',
            onPress: () => navigation.replace('Scanner'),
          },
          {
            text: 'Go to Home',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (err) {
      console.error('Error updating greeting status:', err);
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
        <Text style={styles.headerTitle}>Personalized Greeting</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact Summary Chip */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryAvatar}>
            <Text style={styles.avatarText}>
              {contact.full_name ? contact.full_name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryName}>{contact.full_name || 'Client Contact'}</Text>
            <Text style={styles.summaryCompany}>
              {[contact.designation, contact.company_name].filter(Boolean).join(' • ') ||
                'Visiting Card Contact'}
            </Text>
          </View>
        </View>

        {/* Greeting Editor & Channel Selector */}
        <GreetingPreview
          contact={contact}
          senderCompany={senderCompany}
          onCompanyChange={setSenderCompany}
          onGreetingSent={handleGreetingSent}
        />

        {/* Alternate Option: Save Only */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            navigation.navigate('Home');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Done / Save without opening app</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  summaryDetails: {
    marginLeft: 14,
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryCompany: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  skipBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
