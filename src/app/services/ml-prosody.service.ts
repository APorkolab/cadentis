import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface MLProsodyPrediction {
  syllables: {
    text: string;
    isLong: boolean;
    confidence: number;
    phonemes: string[];
    stress: number;
    features: Float32Array;
  }[];
  overallConfidence: number;
  modelVersion: string;
  processingTime: number;
}

export interface MLTrainingData {
  text: string;
  expectedPattern: boolean[];
  language: 'hungarian' | 'latin' | 'greek';
  verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MLProsodyService {
  private model: tf.LayersModel | null = null;
  private modelLoaded$ = new BehaviorSubject<boolean>(false);
  
  // Feature extractors
  private readonly VOWEL_FEATURES = new Map([
    ['a', [1, 0, 0, 0, 1]], ['á', [1, 0, 0, 0, 0]],
    ['e', [0, 1, 0, 0, 1]], ['é', [0, 1, 0, 0, 0]],
    ['i', [0, 0, 1, 0, 1]], ['í', [0, 0, 1, 0, 0]],
    ['o', [0, 0, 0, 1, 1]], ['ó', [0, 0, 0, 1, 0]],
    ['u', [1, 0, 0, 1, 1]], ['ú', [1, 0, 0, 1, 0]],
    ['ö', [0, 1, 1, 0, 1]], ['ő', [0, 1, 1, 0, 0]],
    ['ü', [0, 0, 1, 1, 1]], ['ű', [0, 0, 1, 1, 0]]
  ]);

  private readonly CONSONANT_CLUSTERS = new Set([
    'bb', 'cc', 'dd', 'ff', 'gg', 'hh', 'jj', 'kk', 'll', 'mm', 
    'nn', 'pp', 'qq', 'rr', 'ss', 'tt', 'vv', 'ww', 'xx', 'yy', 'zz',
    'cs', 'dz', 'dzs', 'gy', 'ly', 'ny', 'sz', 'ty', 'zs',
    'nk', 'ng', 'mb', 'mp', 'nt', 'nd', 'st', 'sk', 'sp', 'tr', 'dr'
  ]);

  constructor() {
    this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      // Create a neural network for syllable length prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [20], // Feature vector size
            units: 128,
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Binary classification: long vs short
          })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Try to load pre-trained weights if available
      try {
        const savedModel = await tf.loadLayersModel('/assets/ml-models/prosody-model.json');
        this.model.setWeights(savedModel.getWeights());
        console.log('✓ Pre-trained prosody model loaded');
      } catch {
        console.log('⚠ No pre-trained model found, using fresh model');
      }

      this.modelLoaded$.next(true);
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
    }
  }

  public analyzeSyllablesML(text: string): Observable<MLProsodyPrediction> {
    const startTime = Date.now();
    
    return from(this.performMLAnalysis(text)).pipe(
      map(result => ({
        ...result,
        modelVersion: '1.0.0',
        processingTime: Date.now() - startTime
      })),
      catchError(error => {
        console.error('ML Analysis failed:', error);
        // Fallback to rule-based analysis
        return this.fallbackAnalysis(text);
      })
    );
  }

  private async performMLAnalysis(text: string): Promise<Omit<MLProsodyPrediction, 'modelVersion' | 'processingTime'>> {
    if (!this.model) {
      throw new Error('ML Model not initialized');
    }

    const syllables = this.extractSyllables(text);
    const predictions = [];
    let totalConfidence = 0;

    for (const syllable of syllables) {
      const features = this.extractFeatures(syllable.text, syllable.context);
      const featureTensor = tf.tensor2d([Array.from(features)]);
      
      const prediction = this.model.predict(featureTensor) as tf.Tensor;
      const confidence = await prediction.data();
      
      const isLong = confidence[0] > 0.5;
      const confidenceScore = isLong ? confidence[0] : 1 - confidence[0];
      
      predictions.push({
        text: syllable.text,
        isLong,
        confidence: confidenceScore,
        phonemes: this.extractPhonemes(syllable.text),
        stress: this.calculateStress(syllable.text, syllable.position),
        features: features
      });

      totalConfidence += confidenceScore;
      
      featureTensor.dispose();
      prediction.dispose();
    }

    return {
      syllables: predictions,
      overallConfidence: totalConfidence / predictions.length
    };
  }

  private extractFeatures(syllable: string, context: { prev?: string; next?: string; wordPosition: number }): Float32Array {
    const features = new Float32Array(20);
    let idx = 0;

    // Vowel features (5 dimensions)
    const vowel = this.findMainVowel(syllable);
    const vowelFeatures = this.VOWEL_FEATURES.get(vowel) || [0, 0, 0, 0, 1];
    for (let i = 0; i < 5; i++) {
      features[idx++] = vowelFeatures[i];
    }

    // Consonant cluster features
    features[idx++] = this.getConsonantClusterCount(syllable);
    features[idx++] = this.hasDoubleConsonant(syllable) ? 1 : 0;
    features[idx++] = this.endsWithConsonantCluster(syllable) ? 1 : 0;

    // Position features
    features[idx++] = context.wordPosition / 10; // Normalized word position
    features[idx++] = syllable.length / 10; // Normalized syllable length

    // Context features
    features[idx++] = context.prev ? 1 : 0;
    features[idx++] = context.next ? 1 : 0;
    
    // Phonological features
    features[idx++] = this.hasLongVowel(syllable) ? 1 : 0;
    features[idx++] = this.hasDiphthong(syllable) ? 1 : 0;
    features[idx++] = this.getVowelCount(syllable);
    features[idx++] = this.getConsonantCount(syllable);

    // Advanced linguistic features
    features[idx++] = this.isSonorant(syllable) ? 1 : 0;
    features[idx++] = this.hasObstruent(syllable) ? 1 : 0;
    features[idx++] = this.calculateSonority(syllable);
    features[idx++] = this.isOpenSyllable(syllable) ? 1 : 0;

    return features;
  }

  private extractSyllables(text: string): Array<{text: string; context: any; position: number}> {
    // Advanced syllable extraction with context
    const words = text.toLowerCase().split(/\s+/);
    const result = [];

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx].replace(/[^\wáéíóúöüőű]/g, '');
      const syllables = this.syllabifyWord(word);
      
      for (let syllIdx = 0; syllIdx < syllables.length; syllIdx++) {
        result.push({
          text: syllables[syllIdx],
          context: {
            prev: syllIdx > 0 ? syllables[syllIdx - 1] : undefined,
            next: syllIdx < syllables.length - 1 ? syllables[syllIdx + 1] : undefined,
            wordPosition: syllIdx
          },
          position: wordIdx
        });
      }
    }

    return result;
  }

  private syllabifyWord(word: string): string[] {
    // Advanced syllabification using ML-informed rules
    const syllables = [];
    let currentSyllable = '';
    const chars = word.split('');

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const isVowel = /[aeiouáéíóúöüőű]/.test(char);
      
      currentSyllable += char;

      if (isVowel) {
        // Check for diphthongs
        if (i + 1 < chars.length && this.isDiphthong(char + chars[i + 1])) {
          currentSyllable += chars[++i];
        }

        // Look ahead for consonants
        let consonantCluster = '';
        let j = i + 1;
        while (j < chars.length && !/[aeiouáéíóúöüőű]/.test(chars[j])) {
          consonantCluster += chars[j];
          j++;
        }

        if (consonantCluster.length === 0 || j >= chars.length) {
          // End of word or vowel hiatus
          syllables.push(currentSyllable);
          currentSyllable = '';
        } else if (consonantCluster.length === 1) {
          // Single consonant goes to next syllable
          syllables.push(currentSyllable);
          currentSyllable = '';
        } else {
          // Multiple consonants - apply ML-informed splitting
          const splitPoint = this.findOptimalConsonantSplit(consonantCluster);
          if (splitPoint > 0) {
            syllables.push(currentSyllable + consonantCluster.substring(0, splitPoint));
            currentSyllable = consonantCluster.substring(splitPoint);
          } else {
            syllables.push(currentSyllable);
            currentSyllable = consonantCluster;
          }
        }
      }
    }

    if (currentSyllable) {
      syllables.push(currentSyllable);
    }

    return syllables.filter(s => s.length > 0);
  }

  // Training functionality
  public async trainModel(trainingData: MLTrainingData[]): Promise<void> {
    if (!this.model) {
      await this.initializeModel();
    }

    console.log(`🧠 Training ML model with ${trainingData.length} examples...`);

    const features = [];
    const labels = [];

    for (const data of trainingData) {
      const syllables = this.extractSyllables(data.text);
      
      for (let i = 0; i < syllables.length && i < data.expectedPattern.length; i++) {
        const syllableFeatures = this.extractFeatures(syllables[i].text, syllables[i].context);
        features.push(Array.from(syllableFeatures));
        labels.push(data.expectedPattern[i] ? 1 : 0);
      }
    }

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const history = await this.model!.fit(xs, ys, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.['loss']?.toFixed(4)}, accuracy = ${logs?.['acc']?.toFixed(4)}`);
          }
        }
      }
    });

    xs.dispose();
    ys.dispose();

    console.log('✅ Model training completed');
    
    // Save the trained model
    await this.model!.save('localstorage://prosody-model');
  }

  // Utility methods
  private findMainVowel(syllable: string): string {
    const vowels = syllable.match(/[aeiouáéíóúöüőű]/g) || [];
    return vowels[0] || 'a';
  }

  private getConsonantClusterCount(syllable: string): number {
    let count = 0;
    const consonants = syllable.replace(/[aeiouáéíóúöüőű]/g, '');
    
    for (const cluster of this.CONSONANT_CLUSTERS) {
      count += (consonants.match(new RegExp(cluster, 'g')) || []).length;
    }
    
    return count;
  }

  private hasDoubleConsonant(syllable: string): boolean {
    return /(.)\1/.test(syllable.replace(/[aeiouáéíóúöüőű]/g, ''));
  }

  private endsWithConsonantCluster(syllable: string): boolean {
    return /[bcdfghjklmnpqrstvwxyz]{2,}$/.test(syllable);
  }

  private hasLongVowel(syllable: string): boolean {
    return /[áéíóúöüőű]/.test(syllable);
  }

  private hasDiphthong(syllable: string): boolean {
    return /[ao]u|[ae]u|[oe]u|[ie]/.test(syllable);
  }

  private isDiphthong(chars: string): boolean {
    return ['au', 'eu', 'ou', 'ai', 'ei', 'oi'].includes(chars);
  }

  private getVowelCount(syllable: string): number {
    return (syllable.match(/[aeiouáéíóúöüőű]/g) || []).length;
  }

  private getConsonantCount(syllable: string): number {
    return syllable.length - this.getVowelCount(syllable);
  }

  private isSonorant(syllable: string): boolean {
    return /[mnlrjw]/.test(syllable);
  }

  private hasObstruent(syllable: string): boolean {
    return /[pbtdkgfvszshx]/.test(syllable);
  }

  private calculateSonority(syllable: string): number {
    const sonorityMap: { [key: string]: number } = {
      'a': 10, 'e': 9, 'i': 8, 'o': 9, 'u': 10,
      'r': 7, 'l': 6, 'n': 5, 'm': 5,
      'w': 4, 'j': 4, 'h': 3,
      'v': 2, 'z': 2, 's': 1, 'f': 1,
      'b': 1, 'd': 1, 'g': 1, 'p': 1, 't': 1, 'k': 1
    };

    let totalSonority = 0;
    for (const char of syllable) {
      totalSonority += sonorityMap[char] || 0;
    }

    return totalSonority / syllable.length;
  }

  private isOpenSyllable(syllable: string): boolean {
    return /[aeiouáéíóúöüőű]$/.test(syllable);
  }

  private findOptimalConsonantSplit(cluster: string): number {
    // ML-informed consonant cluster splitting
    const commonSplits: { [key: string]: number } = {
      'st': 1, 'sp': 1, 'sk': 1, 'sl': 1, 'sm': 1, 'sn': 1,
      'tr': 1, 'dr': 1, 'kr': 1, 'gr': 1, 'pr': 1, 'br': 1,
      'pl': 1, 'bl': 1, 'kl': 1, 'gl': 1, 'fl': 1,
      'nk': 1, 'ng': 1, 'nt': 1, 'nd': 1, 'mp': 1, 'mb': 1
    };

    for (const [pattern, split] of Object.entries(commonSplits)) {
      if (cluster.startsWith(pattern)) {
        return split;
      }
    }

    // Default: split in the middle, but prefer to keep consonant clusters together
    return Math.floor(cluster.length / 2);
  }

  private extractPhonemes(syllable: string): string[] {
    // Simplified phoneme extraction for Hungarian
    const phonemeMap: { [key: string]: string } = {
      'cs': 'tʃ', 'dz': 'dz', 'dzs': 'dʒ', 'gy': 'ɟ', 'ly': 'j',
      'ny': 'ɲ', 'sz': 's', 'ty': 'c', 'zs': 'ʒ'
    };

    let result = syllable;
    for (const [grapheme, phoneme] of Object.entries(phonemeMap)) {
      result = result.replace(new RegExp(grapheme, 'g'), phoneme);
    }

    return result.split('');
  }

  private calculateStress(syllable: string, position: number): number {
    // Hungarian stress is typically on the first syllable
    return position === 0 ? 1.0 : 0.3;
  }

  private fallbackAnalysis(text: string): Observable<MLProsodyPrediction> {
    // Fallback to rule-based analysis if ML fails
    return new Observable(observer => {
      const syllables = this.extractSyllables(text);
      const result: MLProsodyPrediction = {
        syllables: syllables.map(syl => ({
          text: syl.text,
          isLong: this.isLongByRules(syl.text),
          confidence: 0.7, // Lower confidence for rule-based
          phonemes: this.extractPhonemes(syl.text),
          stress: this.calculateStress(syl.text, syl.position),
          features: this.extractFeatures(syl.text, syl.context)
        })),
        overallConfidence: 0.7,
        modelVersion: 'fallback-1.0.0',
        processingTime: 10
      };
      
      observer.next(result);
      observer.complete();
    });
  }

  private isLongByRules(syllable: string): boolean {
    // Traditional rule-based analysis as fallback
    if (/[áéíóúöüőű]/.test(syllable)) return true;
    
    const consonantCluster = syllable.replace(/[aeiouáéíóúöüőű]/g, '');
    return consonantCluster.length >= 2;
  }

  // Public getters
  get isModelLoaded(): Observable<boolean> {
    return this.modelLoaded$.asObservable();
  }

  public getModelMetrics(): any {
    return this.model ? {
      totalParams: this.model.countParams(),
      trainableParams: this.model.trainableWeights.length,
      layers: this.model.layers.length,
      optimizer: this.model.optimizer?.getClassName()
    } : null;
  }
}
