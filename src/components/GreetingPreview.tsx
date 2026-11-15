import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ContactRecord, GreetingChannel } from '../types';
import { buildWhatsAppGreeting, openWhatsAppChat } from '../services/whatsappService';
import { buildEmailBody, buildEmailSubject, openEmailDraft } from '../services/emailService';
import { isValidPhoneNumber } from '../utils/phoneValidator';
import { isValidEmail } from '../utils/emailValidator';

interface GreetingPreviewComponentProps {
  contact: ContactRecord;
  senderCompany: string;
  onCompanyChange: (company: string) => void;
  onGreetingSent: (channel: GreetingChannel) => void;
}

export const GreetingPreview: React.FC<GreetingPreviewComponentProps> = ({
  contact,
  senderCompany,
  onCompanyChange,
  onGreetingSent,
}) => {
  const hasPhone = isValidPhoneNumber(contact.whatsapp_number || contact.phone_number);
  const hasEmail = isValidEmail(contact.email);

  // Highest priority is WhatsApp if phone is present; otherwise Email fallback
  const [selectedChannel, setSelectedChannel] = useState<GreetingChannel>(
    hasPhone ? 'whatsapp' : hasEmail ? 'email' : 'none'
  );

  const [message, setMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  // Update templates whenever contact or company changes
  useEffect(() => {
    if (selectedChannel === 'whatsapp') {
      setMessage(buildWhatsAppGreeting(contact.full_name, senderCompany));
    } else if (selectedChannel === 'email') {
      setMessage(buildEmailBody(contact.full_name, senderCompany));
      setEmailSubject(buildEmailSubject(contact.full_name));
    }
  }, [selectedChannel, contact.full_name, senderCompany]);

  const handleOpenAction = async () => {
    setIsOpening(true);

    try {
      if (selectedChannel === 'whatsapp') {
        const targetPhone = contact.whatsapp_number || contact.phone_number;
        const res = await openWhatsAppChat({
          phoneNumber: targetPhone,
          clientName: contact.full_name,
          senderCompany: senderCompany,
          customMessage: message,
        });

        if (res.success) {
          onGreetingSent('whatsapp');
        } else {
          Alert.alert(
            'WhatsApp Route Unavailable',
            res.error || 'Could not open WhatsApp.',
            hasEmail
              ? [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Switch to Email Fallback',
                    onPress: () => setSelectedChannel('email'),
                  },
                ]
              : [{ text: 'OK' }]
          );
        }
      } else if (selectedChannel === 'email') {
        const res = await openEmailDraft({
          email: contact.email,
          clientName: contact.full_name,
          senderCompany: senderCompany,
          customSubject: emailSubject,
          customBody: message,
        });

        if (res.success) {
          onGreetingSent('email');
        } else {
          Alert.alert('Email Fallback Error', res.error || 'Could not open email application.');
        }
      } else {
        Alert.alert('No Channel', 'Please provide a valid phone number or email address.');
      }
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Channel Switcher */}
      <View style={styles.channelRow}>
        <TouchableOpacity
          style={[
            styles.channelTab,
            selectedChannel === 'whatsapp' && styles.channelTabActiveWhatsApp,
            !hasPhone && styles.channelTabDisabled,
          ]}
          onPress={() => hasPhone && setSelectedChannel('whatsapp')}
          disabled={!hasPhone}
        >
          <MaterialCommunityIcons
            name="whatsapp"
            size={18}
            color={selectedChannel === 'whatsapp' ? '#FFFFFF' : '#22C55E'}
          />
          <Text
            style={[
              styles.channelTabText,
              selectedChannel === 'whatsapp' && styles.channelTabTextActive,
            ]}
          >
            WhatsApp (Primary)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.channelTab,
            selectedChannel === 'email' && styles.channelTabActiveEmail,
            !hasEmail && styles.channelTabDisabled,
          ]}
          onPress={() => hasEmail && setSelectedChannel('email')}
          disabled={!hasEmail}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={18}
            color={selectedChannel === 'email' ? '#FFFFFF' : '#3B82F6'}
          />
          <Text
            style={[
              styles.channelTabText,
              selectedChannel === 'email' && styles.channelTabTextActive,
            ]}
          >
            Email Fallback
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Recipient Banner */}
      <View style={styles.recipientBanner}>
        <MaterialCommunityIcons
          name={selectedChannel === 'whatsapp' ? 'phone-check' : 'email-check'}
          size={18}
          color="#334155"
        />
        <Text style={styles.recipientText}>
          {selectedChannel === 'whatsapp'
            ? `Recipient: ${contact.whatsapp_number || contact.phone_number || 'No number'}`
            : `Recipient: ${contact.email || 'No email'}`}
        </Text>
      </View>

      {/* Sender Company Signature */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your Company Signature</Text>
        <TextInput
          style={styles.textInput}
          value={senderCompany}
          onChangeText={onCompanyChange}
          placeholder="E.g. Acme Corporation"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Email Subject Field (if email) */}
      {selectedChannel === 'email' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Subject</Text>
          <TextInput
            style={styles.textInput}
            value={emailSubject}
            onChangeText={setEmailSubject}
            placeholder="Welcome email subject"
            placeholderTextColor="#94A3B8"
          />
        </View>
      )}

      {/* Message Body Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Greeting Message (Review & Edit)</Text>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Safety Notice */}
      <View style={styles.safetyBox}>
        <MaterialCommunityIcons name="shield-check-outline" size={16} color="#059669" />
        <Text style={styles.safetyText}>
          Tapping below will open your app with this greeting pre-filled. You will review and tap
          Send inside WhatsApp / Email.
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          selectedChannel === 'whatsapp' ? styles.actionBtnWhatsApp : styles.actionBtnEmail,
          (!hasPhone && selectedChannel === 'whatsapp') && styles.actionBtnDisabled,
          (!hasEmail && selectedChannel === 'email') && styles.actionBtnDisabled,
        ]}
        onPress={handleOpenAction}
        disabled={isOpening}
        activeOpacity={0.8}
      >
        {isOpening ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialCommunityIcons
              name={selectedChannel === 'whatsapp' ? 'whatsapp' : 'email'}
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.actionBtnText}>
              {selectedChannel === 'whatsapp'
                ? 'Open WhatsApp Business'
                : 'Open Email Application'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  channelRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  channelTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  channelTabActiveWhatsApp: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  channelTabActiveEmail: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  channelTabDisabled: {
    opacity: 0.4,
  },
  channelTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  channelTabTextActive: {
    color: '#FFFFFF',
  },
  recipientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  recipientText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  messageInput: {
    minHeight: 120,
    lineHeight: 20,
  },
  safetyBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  safetyText: {
    color: '#065F46',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionBtnWhatsApp: {
    backgroundColor: '#25D366',
  },
  actionBtnEmail: {
    backgroundColor: '#2563EB',
  },
  actionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
