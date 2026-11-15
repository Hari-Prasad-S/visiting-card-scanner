import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExtractedContact } from '../types';
import { isValidPhoneNumber } from '../utils/phoneValidator';
import { isValidEmail } from '../utils/emailValidator';

interface ContactDetailsProps {
  contact: ExtractedContact;
  onChange: (updated: ExtractedContact) => void;
}

export const ContactDetails: React.FC<ContactDetailsProps> = ({ contact, onChange }) => {
  const [showRawText, setShowRawText] = useState(false);

  const updateField = (field: keyof ExtractedContact, value: string) => {
    onChange({
      ...contact,
      [field]: value,
    });
  };

  const isPhoneValid = isValidPhoneNumber(contact.phone_number);
  const isEmailValid = isValidEmail(contact.email);

  return (
    <View style={styles.container}>
      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="account" size={16} color="#64748B" />
          <Text style={styles.label}>Full Name *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={contact.full_name}
          onChangeText={(v) => updateField('full_name', v)}
          placeholder="Client full name"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Designation */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="badge-account-outline" size={16} color="#64748B" />
          <Text style={styles.label}>Designation / Role</Text>
        </View>
        <TextInput
          style={styles.input}
          value={contact.designation}
          onChangeText={(v) => updateField('designation', v)}
          placeholder="E.g. Senior Business Manager"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Company Name */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="domain" size={16} color="#64748B" />
          <Text style={styles.label}>Company Name</Text>
        </View>
        <TextInput
          style={styles.input}
          value={contact.company_name}
          onChangeText={(v) => updateField('company_name', v)}
          placeholder="Company / Organization"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Mobile / Phone Number */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="phone" size={16} color="#64748B" />
          <Text style={styles.label}>Mobile / Phone Number</Text>
          {contact.phone_number ? (
            <View style={[styles.badge, isPhoneValid ? styles.badgeValid : styles.badgeInvalid]}>
              <Text style={styles.badgeText}>{isPhoneValid ? 'Valid' : 'Check format'}</Text>
            </View>
          ) : null}
        </View>
        <TextInput
          style={styles.input}
          value={contact.phone_number}
          onChangeText={(v) => updateField('phone_number', v)}
          placeholder="+91 9876543210"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />
      </View>

      {/* WhatsApp Number */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
          <Text style={styles.label}>WhatsApp Target Number</Text>
          <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.badgeText, { color: '#15803D' }]}>High Priority</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={contact.whatsapp_number || contact.phone_number}
          onChangeText={(v) => updateField('whatsapp_number', v)}
          placeholder="+91 9876543210"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />
      </View>

      {/* Email Address */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color="#64748B" />
          <Text style={styles.label}>Email Address</Text>
          {contact.email ? (
            <View style={[styles.badge, isEmailValid ? styles.badgeValid : styles.badgeInvalid]}>
              <Text style={styles.badgeText}>{isEmailValid ? 'Valid Email' : 'Check format'}</Text>
            </View>
          ) : null}
        </View>
        <TextInput
          style={styles.input}
          value={contact.email}
          onChangeText={(v) => updateField('email', v)}
          placeholder="client@company.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Website */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="web" size={16} color="#64748B" />
          <Text style={styles.label}>Website</Text>
        </View>
        <TextInput
          style={styles.input}
          value={contact.website}
          onChangeText={(v) => updateField('website', v)}
          placeholder="www.company.com"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
        />
      </View>

      {/* Address */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
          <Text style={styles.label}>Office Address</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={contact.address}
          onChangeText={(v) => updateField('address', v)}
          placeholder="Street address, city, postal code"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Raw OCR Accordion (Helpful for verification) */}
      <TouchableOpacity
        style={styles.rawTextToggle}
        onPress={() => setShowRawText(!showRawText)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={showRawText ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#64748B"
        />
        <Text style={styles.rawTextToggleLabel}>
          {showRawText ? 'Hide Raw OCR Text' : 'View Detected Raw OCR Text'}
        </Text>
      </TouchableOpacity>

      {showRawText && (
        <View style={styles.rawTextContainer}>
          <Text style={styles.rawTextContent}>{contact.raw_text || 'No raw text recorded.'}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeValid: {
    backgroundColor: '#DCFCE7',
  },
  badgeInvalid: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  rawTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  rawTextToggleLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  rawTextContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rawTextContent: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});

