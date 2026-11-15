import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard business card ratio ~1.58 (Width 85mm x Height 54mm)
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH / 1.58;

interface ScanOverlayProps {
  status: 'searching' | 'sampling' | 'detected' | 'success';
  detectedSnippet?: string;
  isStable?: boolean;
}

export const ScanOverlay: React.FC<ScanOverlayProps> = ({
  status,
  detectedSnippet,
  isStable,
}) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: CARD_HEIGHT - 4,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const getStatusText = () => {
    switch (status) {
      case 'searching':
        return 'Position visiting card inside frame';
      case 'sampling':
        return 'Analyzing card details...';
      case 'detected':
        return 'Card detected, verifying text...';
      case 'success':
        return 'Card verified! Extracting...';
      default:
        return 'Hold card steady';
    }
  };

  const getBorderColor = () => {
    if (status === 'success') return '#10B981'; // emerald green
    if (status === 'detected' || isStable) return '#3B82F6'; // blue
    return '#E2E8F0'; // clean white/slate
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top Dimmed Overlay */}
      <View style={[styles.mask, { height: (SCREEN_HEIGHT - CARD_HEIGHT) / 2 - 40 }]} />

      <View style={styles.centerRow}>
        {/* Left Dimmed Overlay */}
        <View style={[styles.mask, { width: (SCREEN_WIDTH - CARD_WIDTH) / 2 }]} />

        {/* Viewfinder Cutout */}
        <View style={[styles.viewfinder, { borderColor: getBorderColor() }]}>
          {/* 4 Corner Markers */}
          <View style={[styles.corner, styles.topLeft, { borderColor: getBorderColor() }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: getBorderColor() }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: getBorderColor() }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: getBorderColor() }]} />

          {/* Animated Laser Scan Line */}
          {status !== 'success' && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanLineAnim }],
                  backgroundColor: status === 'detected' ? '#3B82F6' : '#22C55E',
                },
              ]}
            />
          )}

          {/* Success Flash Overlay */}
          {status === 'success' && (
            <View style={styles.successCover}>
              <MaterialCommunityIcons name="check-circle" size={54} color="#10B981" />
              <Text style={styles.successCoverText}>Card Captured</Text>
            </View>
          )}

          {/* Live text snippet preview */}
          {detectedSnippet ? (
            <View style={styles.snippetBadge}>
              <Text style={styles.snippetText} numberOfLines={1}>
                {detectedSnippet}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Right Dimmed Overlay */}
        <View style={[styles.mask, { width: (SCREEN_WIDTH - CARD_WIDTH) / 2 }]} />
      </View>

      {/* Bottom Dimmed Overlay with Status Banner */}
      <View style={[styles.mask, styles.bottomMask]}>
        <View style={[styles.statusBadge, status === 'success' && styles.statusBadgeSuccess]}>
          <MaterialCommunityIcons
            name={
              status === 'success'
                ? 'check-circle'
                : status === 'detected'
                ? 'text-recognition'
                : 'card-account-details-outline'
            }
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <Text style={styles.instructions}>
          No button required. Hold still — scans automatically.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  centerRow: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
  },
  viewfinder: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  scanLine: {
    height: 3,
    width: '100%',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  snippetBadge: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  snippetText: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  bottomMask: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 28,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBadgeSuccess: {
    backgroundColor: '#065F46',
    borderColor: '#10B981',
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
  successCover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCoverText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
});
