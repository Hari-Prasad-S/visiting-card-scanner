import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList, ExtractedContact, ContactRecord } from '../types';
import { ContactDetails } from '../components/ContactDetails';
import { storageService } from '../services/storageService';

type ContactPreviewRouteProp = RouteProp<RootStackParamList, 'ContactPreview'>;
type ContactPreviewNavProp = NativeStackNavigationProp<RootStackParamList, 'ContactPreview'>;

export const ContactPreviewScreen: React.FC = () => {
  const navigation = useNavigation<ContactPreviewNavProp>();
  const route = useRoute<ContactPreviewRouteProp>();

  const initialContact = route.params?.contact || {
    full_name: '',
    designation: '',
    company_name: '',
    phone_number: '',
    whatsapp_number: '',
    email: '',
    website: '',
    address: '',
    raw_text: '',
  };

  const isExisting = route.params?.isExisting || false;
  const [contact, setContact] = useState<ExtractedContact>(initialContact);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (!contact.full_name && !contact.phone_number && !contact.email) {
      Alert.alert(
        'Missing Information',
        'Please provide at least a Name, Phone Number, or Email Address.'
      );
      return;
    }

    setIsSaving(true);
    try {
      // Save contact to local SQLite database
      const result = await storageService.saveContact(contact, 'none', 'drafted');

      const contactRecord: ContactRecord = {
        ...contact,
        id: result.id,
        scan_date: new Date().toISOString(),
        greeting_channel: 'none',
        greeting_status: 'drafted',
      };

      navigation.navigate('GreetingPreview', { contact: contactRecord });
    } catch (err) {
      console.error('Failed to save contact:', err);
      Alert.alert('Save Error', 'Could not save contact to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Contact Details</Text>
        <TouchableOpacity
          style={styles.rescanBtn}
          onPress={() => navigation.replace('Scanner')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera-retake-outline" size={20} color="#2563EB" />
          <Text style={styles.rescanText}>Rescan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Duplicate Contact Notice */}
        {isExisting && (
          <View style={styles.duplicateNotice}>
            <MaterialCommunityIcons name="information" size={20} color="#D97706" />
            <Text style={styles.duplicateText}>
              A contact with matching phone/email already exists. Continuing will update their details.
            </Text>
          </View>
        )}

        {/* Success Scan Header Card */}
        <View style={styles.scanSuccessBanner}>
          <MaterialCommunityIcons name="check-decagram" size={26} color="#16A34A" />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Visiting Card Detected</Text>
            <Text style={styles.bannerSubtitle}>
              Fields auto-extracted via Google ML Kit. You can edit any field below.
            </Text>
          </View>
        </View>

        {/* Editable Form Fields */}
        <ContactDetails contact={contact} onChange={setContact} />

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Continue to Greeting</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanNextBtn}
          onPress={() => navigation.replace('Scanner')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#64748B" />
          <Text style={styles.scanNextBtnText}>Discard & Scan Next Card</Text>
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
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  rescanText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  duplicateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  duplicateText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
  },
  scanSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
    elevation: 3,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scanNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
    gap: 6,
  },
  scanNextBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
