import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList, ExtractedContact } from '../types';
import { ScanOverlay } from '../components/ScanOverlay';
import { ocrService } from '../services/ocrService';
import { parseVisitingCard } from '../services/contactParser';
import { isValidPhoneNumber } from '../utils/phoneValidator';
import { isValidEmail } from '../utils/emailValidator';
import { storageService } from '../services/storageService';

type ScannerNavProp = NativeStackNavigationProp<RootStackParamList, 'Scanner'>;

export const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<ScannerNavProp>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [scanStatus, setScanStatus] = useState<'searching' | 'sampling' | 'detected' | 'success'>('searching');
  const [detectedSnippet, setDetectedSnippet] = useState('');
  const [isExpoGoMode, setIsExpoGoMode] = useState(false);

  // Scanning loop state and locks
  const isScanningRef = useRef(true);
  const isProcessingRef = useRef(false);
  const consecutiveMatchesRef = useRef(0);
  const lastExtractedContactRef = useRef<ExtractedContact | null>(null);

  // Automatically request camera permission on launch
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Main automatic sampling loop
  const processFrame = useCallback(async () => {
    if (!isScanningRef.current || isProcessingRef.current || !cameraRef.current || !isFocused) {
      return;
    }

    isProcessingRef.current = true;

    try {
      setScanStatus((prev) => (prev === 'searching' ? 'sampling' : prev));

      // Fast, lightweight silent capture for OCR sampling
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        base64: true,
        skipProcessing: true,
        shutterSound: false,
      });

      if (photo?.uri) {
        const ocrResult = await ocrService.recognizeText(photo.uri, photo.base64);

        if (ocrResult.isExpoGo) {
          setIsExpoGoMode(true);
        }

        if (ocrResult.success && ocrResult.text.trim().length > 12) {
          const parsed = parseVisitingCard(ocrResult.text);

          const hasValidPhone = isValidPhoneNumber(parsed.phone_number);
          const hasValidEmail = isValidEmail(parsed.email);
          const hasName = parsed.full_name.trim().length >= 3;

          // Check if card has sufficient recognizable contact anchors
          if ((hasValidPhone || hasValidEmail) && (hasName || parsed.company_name)) {
            consecutiveMatchesRef.current += 1;
            lastExtractedContactRef.current = parsed;

            setScanStatus('detected');
            setDetectedSnippet(
              [parsed.full_name, parsed.phone_number || parsed.email]
                .filter(Boolean)
                .join(' • ')
            );

            // Require 2 consecutive stable frames (or 1 if all 3 key anchors are present)
            const isHighConfidence = hasValidPhone && hasValidEmail && hasName;
            if (consecutiveMatchesRef.current >= 2 || isHighConfidence) {
              // Target successfully locked!
              isScanningRef.current = false;
              setScanStatus('success');

              if (Platform.OS !== 'web') {
                Vibration.vibrate([0, 120]);
              }

              // Check if duplicate in database
              const existing = await storageService.checkDuplicate(
                parsed.phone_number,
                parsed.email
              );

              // Delay briefly so user sees the green success confirmation
              setTimeout(() => {
                navigation.replace('ContactPreview', {
                  contact: parsed,
                  isExisting: !!existing,
                });
              }, 400);

              return;
            }
          } else {
            // Not enough contact fields detected yet
            consecutiveMatchesRef.current = 0;
            setScanStatus('searching');
          }
        } else {
          consecutiveMatchesRef.current = 0;
          setScanStatus('searching');
        }
      }
    } catch (err) {
      console.warn('Frame sampling skipped / camera busy:', err);
    } finally {
      isProcessingRef.current = false;

      // Schedule next sample after optimized interval
      if (isScanningRef.current && isFocused) {
        setTimeout(processFrame, isExpoGoMode ? 1000 : 650);
      }
    }
  }, [isFocused, navigation]);

  // Start sampling when focused and permission granted
  useEffect(() => {
    if (isFocused && permission?.granted) {
      isScanningRef.current = true;
      isProcessingRef.current = false;
      consecutiveMatchesRef.current = 0;
      setScanStatus('searching');
      setDetectedSnippet('');

      // Give camera 600ms to initialize sensor before starting first frame
      const timer = setTimeout(() => {
        processFrame();
      }, 600);

      return () => {
        isScanningRef.current = false;
        clearTimeout(timer);
      };
    }
  }, [isFocused, permission?.granted, processFrame]);

  // Fallback demo for testing if camera is in simulator or offline
  const handleTestDemoCard = () => {
    const sampleText = `JOHN MATHEW\nSenior Business Manager\nABC Technologies Pvt Ltd\nMobile: +91 9876543210\nEmail: john@abc.com\nWebsite: www.abc.com`;
    const parsed = parseVisitingCard(sampleText);
    isScanningRef.current = false;
    setScanStatus('success');
    setTimeout(() => {
      navigation.replace('ContactPreview', {
        contact: parsed,
        isExisting: false,
      });
    }, 300);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={54} color="#EF4444" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          To automatically detect and scan visiting cards without manual photo capture, camera
          permission is required.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnAlt} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Live Camera Feed */}
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torchOn}
        />
      )}

      {/* Modern Auto-Scan Viewfinder Overlay */}
      <ScanOverlay
        status={scanStatus}
        detectedSnippet={detectedSnippet}
        isStable={consecutiveMatchesRef.current > 0}
      />

      {/* Top Header Controls */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.scannerHeaderTitle}>Auto Visiting Card Scanner</Text>

        <TouchableOpacity
          style={[styles.circleBtn, torchOn && styles.circleBtnActive]}
          onPress={() => setTorchOn(!torchOn)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={torchOn ? 'flashlight' : 'flashlight-off'}
            size={22}
            color={torchOn ? '#FBBF24' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Expo Go Notice & Quick Demo Trigger */}
      <View style={styles.bottomBar}>
        {isExpoGoMode && (
          <View style={styles.expoGoBanner}>
            <MaterialCommunityIcons name="information" size={18} color="#FBBF24" />
            <Text style={styles.expoGoBannerText}>
              Testing in Expo Go: Google ML Kit runs in the standalone APK. Tap below to test the
              card extraction & WhatsApp greeting flow!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.demoCardBtn, isExpoGoMode && styles.demoCardBtnHighlight]}
          onPress={handleTestDemoCard}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="card-text-outline"
            size={18}
            color={isExpoGoMode ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.demoCardText, isExpoGoMode && styles.demoCardTextHighlight]}>
            {isExpoGoMode ? '⚡ Scan Sample Visiting Card' : 'Load Sample Card (Quick Test)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  backBtnAlt: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnAltText: {
    color: '#64748B',
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  scannerHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  demoCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  demoCardBtnHighlight: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  demoCardText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  demoCardTextHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  expoGoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 8,
    maxWidth: 340,
  },
  expoGoBannerText: {
    color: '#F8FAFC',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
