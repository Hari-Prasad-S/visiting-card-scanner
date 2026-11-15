import { NativeModules } from 'react-native';

export interface OCRResult {
  text: string;
  lines: string[];
  success: boolean;
  isExpoGo?: boolean;
  source?: 'mlkit-native' | 'expo-go-ocr-fallback';
  error?: string;
}

/**
 * Service to execute Google ML Kit On-Device Text Recognition
 * with automatic cloud OCR fallback when running inside Expo Go.
 */
class OCRService {
  private mlkitModule: any = null;
  private isModuleChecked: boolean = false;

  /**
   * Verifies whether native ML Kit module is linked in current runtime.
   * - In standard Expo Go: False (native C++/Java modules are not in Expo Go's Play Store binary).
   * - In Expo Development Builds or standalone APKs: True.
   */
  public isNativeMLKitAvailable(): boolean {
    return !!(NativeModules && NativeModules.TextRecognition);
  }

  private async getMLKit() {
    if (!this.isModuleChecked) {
      this.isModuleChecked = true;
      if (this.isNativeMLKitAvailable()) {
        try {
          const mlkit = require('@react-native-ml-kit/text-recognition');
          this.mlkitModule = mlkit.default || mlkit;
        } catch (err) {
          console.warn('Native ML Kit module load warning:', err);
          this.mlkitModule = null;
        }
      }
    }
    return this.mlkitModule;
  }

  /**
   * Processes an image file URI and returns recognized text.
   * - If native ML Kit is present (APK): runs on-device Google ML Kit.
   * - If in Expo Go: seamlessly uses fast OCR fallback so you can scan real cards inside Expo Go!
   */
  public async recognizeText(imageUri: string, base64Data?: string): Promise<OCRResult> {
    if (!imageUri && !base64Data) {
      return { text: '', lines: [], success: false, error: 'Empty image URI provided' };
    }

    // 1. NATIVE MODE: Google ML Kit (Runs in Standalone APK & Development Build)
    if (this.isNativeMLKitAvailable()) {
      try {
        const mlkit = await this.getMLKit();
        if (mlkit && typeof mlkit.recognize === 'function') {
          const result = await mlkit.recognize(imageUri);
          const fullText = (result.text || '').trim();
          const extractedLines: string[] = [];

          if (result.blocks && Array.isArray(result.blocks)) {
            for (const block of result.blocks) {
              if (block.lines && Array.isArray(block.lines)) {
                for (const line of block.lines) {
                  if (line.text && line.text.trim()) {
                    extractedLines.push(line.text.trim());
                  }
                }
              }
            }
          }

          return {
            text: fullText,
            lines: extractedLines.length > 0 ? extractedLines : fullText.split('\n').filter(Boolean),
            success: true,
            source: 'mlkit-native',
          };
        }
      } catch (nativeErr: any) {
        console.warn('Native ML Kit error, falling back:', nativeErr?.message || nativeErr);
      }
    }

    // 2. EXPO GO FALLBACK MODE: Allows real camera scanning inside Expo Go
    if (base64Data) {
      try {
        const formData = new FormData();
        console.log("hello")
        formData.append('apikey', 'helloworld');
        formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');

        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data && data.ParsedResults && data.ParsedResults.length > 0) {
          const parsedText = (data.ParsedResults[0].ParsedText || '').trim();
          if (parsedText) {
            const lines = parsedText.split('\n').map((l: string) => l.trim()).filter(Boolean);
            return {
              text: parsedText,
              lines,
              success: true,
              isExpoGo: true,
              source: 'expo-go-ocr-fallback',
            };
          }
        }
      } catch (fallbackErr: any) {
        console.warn('Expo Go OCR fallback network notice:', fallbackErr?.message || fallbackErr);
      }
    }

    return {
      text: '',
      lines: [],
      success: false,
      isExpoGo: !this.isNativeMLKitAvailable(),
      error: 'Text could not be recognized. Please hold card steady.',
    };
  }
}

export const ocrService = new OCRService();
