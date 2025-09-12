import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AudioProsodyFeatures {
  pitch: number[];
  intensity: number[];
  duration: number[];
  formants: {
    f1: number[];
    f2: number[];
    f3: number[];
  };
  spectralCentroid: number[];
  zeroCrossingRate: number[];
  mfcc: number[][];
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  words: {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }[];
  prosodyFeatures: AudioProsodyFeatures;
}

export interface VoiceAnalysis {
  syllables: {
    text: string;
    startTime: number;
    endTime: number;
    duration: number;
    pitch: number;
    intensity: number;
    isLong: boolean;
    confidence: number;
  }[];
  overallMetrics: {
    avgPitch: number;
    pitchRange: number;
    avgIntensity: number;
    speechRate: number; // syllables per second
    pauseRatio: number;
  };
  rhythmPattern: string;
  stressPattern: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AudioAnalysisService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  
  private isRecording$ = new BehaviorSubject<boolean>(false);
  private audioLevel$ = new BehaviorSubject<number>(0);
  private recognitionResults$ = new Subject<SpeechRecognitionResult>();
  
  // Speech Recognition (WebKit)
  private recognition: any = null;
  
  // Audio processing buffers
  private audioBuffer: Float32Array[] = [];
  private sampleRate = 44100;
  
  constructor() {
    this.initializeAudioContext();
    this.initializeSpeechRecognition();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate,
        latencyHint: 'interactive'
      });
      
      console.log('🎵 Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'hu-HU'; // Hungarian
      this.recognition.maxAlternatives = 3;
      
      this.recognition.onresult = (event: any) => {
        this.processSpeechRecognitionResult(event);
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      console.log('🎙️ Speech recognition initialized');
    } else {
      console.warn('⚠️ Speech recognition not supported');
    }
  }

  // Public API
  public async startRecording(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      await this.setupAudioProcessing();
      this.startMediaRecorder();
      
      if (this.recognition) {
        this.recognition.start();
      }
      
      this.isRecording$.next(true);
      console.log('🎤 Recording started');
      return true;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  public stopRecording(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    this.isRecording$.next(false);
    console.log('⏹️ Recording stopped');
  }

  public analyzeRecordedAudio(audioBlob: Blob): Observable<VoiceAnalysis> {
    return new Observable(observer => {
      this.processAudioBlob(audioBlob).then(analysis => {
        observer.next(analysis);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  public get isRecording(): Observable<boolean> {
    return this.isRecording$.asObservable();
  }

  public get audioLevel(): Observable<number> {
    return this.audioLevel$.asObservable();
  }

  public get speechRecognition(): Observable<SpeechRecognitionResult> {
    return this.recognitionResults$.asObservable();
  }

  // Audio Processing
  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    source.connect(this.analyser);
    
    // Start real-time analysis
    this.startRealTimeAnalysis();
  }

  private startRealTimeAnalysis(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const floatArray = new Float32Array(bufferLength);
    
    const analyze = () => {
      if (!this.isRecording$.value) return;
      
      this.analyser!.getByteFrequencyData(dataArray);
      this.analyser!.getFloatTimeDomainData(floatArray);
      
      // Calculate audio level
      const level = this.calculateAudioLevel(dataArray);
      this.audioLevel$.next(level);
      
      // Store audio data for processing
      this.audioBuffer.push(new Float32Array(floatArray));
      
      // Keep buffer size manageable (last 10 seconds at ~60fps)
      if (this.audioBuffer.length > 600) {
        this.audioBuffer.shift();
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  private calculateAudioLevel(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length / 255;
  }

  private startMediaRecorder(): void {
    if (!this.mediaStream) return;
    
    this.recorder = new MediaRecorder(this.mediaStream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    const chunks: BlobPart[] = [];
    
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    this.recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      this.processRecordedAudio(blob);
      chunks.length = 0;
    };
    
    this.recorder.start(100); // Collect data every 100ms
  }

  // Speech Recognition Processing
  private processSpeechRecognitionResult(event: any): void {
    const results = Array.from(event.results).map((result: any) => ({
      transcript: result[0].transcript,
      confidence: result[0].confidence,
      isFinal: result.isFinal
    }));
    
    if (results.some((r: any) => r.isFinal)) {
      const finalResult = results.find((r: any) => r.isFinal);
      if (finalResult) {
        this.analyzeTranscript(finalResult.transcript, finalResult.confidence);
      }
    }
  }

  private async analyzeTranscript(transcript: string, confidence: number): Promise<void> {
    // Word-level timing would require more advanced speech recognition
    // For now, we'll estimate based on syllable count and duration
    const words = transcript.split(' ').map((word, index) => ({
      text: word,
      startTime: index * 0.6, // Estimated 600ms per word
      endTime: (index + 1) * 0.6,
      confidence: confidence
    }));

    const prosodyFeatures = await this.extractProsodyFeatures();
    
    const result: SpeechRecognitionResult = {
      transcript,
      confidence,
      words,
      prosodyFeatures
    };
    
    this.recognitionResults$.next(result);
  }

  // Advanced Audio Analysis
  private async processRecordedAudio(blob: Blob): Promise<void> {
    try {
      const analysis = await this.processAudioBlob(blob);
      console.log('🎵 Audio analysis completed:', analysis);
    } catch (error) {
      console.error('Audio processing failed:', error);
    }
  }

  private async processAudioBlob(blob: Blob): Promise<VoiceAnalysis> {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    return this.analyzeAudioBuffer(audioBuffer);
  }

  private async analyzeAudioBuffer(audioBuffer: AudioBuffer): Promise<VoiceAnalysis> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Extract prosodic features
    const pitch = this.extractPitch(channelData, sampleRate);
    const intensity = this.extractIntensity(channelData, sampleRate);
    const syllables = this.detectSyllables(channelData, intensity, sampleRate);
    
    // Calculate overall metrics
    const overallMetrics = {
      avgPitch: pitch.reduce((a, b) => a + b, 0) / pitch.length,
      pitchRange: Math.max(...pitch) - Math.min(...pitch),
      avgIntensity: intensity.reduce((a, b) => a + b, 0) / intensity.length,
      speechRate: syllables.length / audioBuffer.duration,
      pauseRatio: this.calculatePauseRatio(intensity)
    };
    
    // Determine prosodic patterns
    const rhythmPattern = this.analyzeRhythmPattern(syllables);
    const stressPattern = this.analyzeStressPattern(syllables);
    
    return {
      syllables,
      overallMetrics,
      rhythmPattern,
      stressPattern
    };
  }

  // Feature Extraction Methods
  private extractPitch(audioData: Float32Array, sampleRate: number): number[] {
    // Simplified pitch extraction using autocorrelation
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(sampleRate * 0.010); // 10ms hop
    const pitch: number[] = [];
    
    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const f0 = this.autocorrelationPitch(frame, sampleRate);
      pitch.push(f0);
    }
    
    return pitch;
  }

  private autocorrelationPitch(frame: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let maxCorr = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < frame.length / 2; period++) {
      let corr = 0;
      for (let i = 0; i < frame.length - period; i++) {
        corr += frame[i] * frame[i + period];
      }
      
      if (corr > maxCorr) {
        maxCorr = corr;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  private extractIntensity(audioData: Float32Array, sampleRate: number): number[] {
    const frameSize = Math.floor(sampleRate * 0.025);
    const hopSize = Math.floor(sampleRate * 0.010);
    const intensity: number[] = [];
    
    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      let sum = 0;
      for (let j = i; j < i + frameSize; j++) {
        sum += audioData[j] * audioData[j];
      }
      intensity.push(Math.sqrt(sum / frameSize));
    }
    
    return intensity;
  }

  private detectSyllables(audioData: Float32Array, intensity: number[], sampleRate: number): any[] {
    // Simplified syllable detection based on intensity peaks
    const threshold = Math.max(...intensity) * 0.3;
    const syllables: any[] = [];
    const frameTime = 0.010; // 10ms per frame
    
    let inSyllable = false;
    let syllableStart = 0;
    
    for (let i = 0; i < intensity.length; i++) {
      if (!inSyllable && intensity[i] > threshold) {
        inSyllable = true;
        syllableStart = i * frameTime;
      } else if (inSyllable && intensity[i] <= threshold) {
        inSyllable = false;
        const syllableEnd = i * frameTime;
        const duration = syllableEnd - syllableStart;
        
        if (duration > 0.05 && duration < 1.0) { // 50ms to 1s
          syllables.push({
            text: `syl${syllables.length + 1}`, // Would need ASR for actual text
            startTime: syllableStart,
            endTime: syllableEnd,
            duration,
            pitch: this.getAveragePitch(syllableStart, syllableEnd, frameTime),
            intensity: this.getAverageIntensity(syllableStart, syllableEnd, intensity, frameTime),
            isLong: duration > 0.15, // Simple duration-based length
            confidence: 0.8
          });
        }
      }
    }
    
    return syllables;
  }

  private getAveragePitch(start: number, end: number, frameTime: number): number {
    // Simplified - would extract from actual pitch array
    return 150 + Math.random() * 100; // Placeholder
  }

  private getAverageIntensity(start: number, end: number, intensity: number[], frameTime: number): number {
    const startIdx = Math.floor(start / frameTime);
    const endIdx = Math.floor(end / frameTime);
    
    let sum = 0;
    let count = 0;
    for (let i = startIdx; i < endIdx && i < intensity.length; i++) {
      sum += intensity[i];
      count++;
    }
    
    return count > 0 ? sum / count : 0;
  }

  private analyzeRhythmPattern(syllables: any[]): string {
    // Simple rhythm pattern based on syllable durations
    return syllables.map(syl => syl.isLong ? '–' : '∪').join('');
  }

  private analyzeStressPattern(syllables: any[]): number[] {
    // Stress based on pitch and intensity
    return syllables.map(syl => {
      const stressScore = (syl.pitch / 300) * 0.5 + (syl.intensity / 1.0) * 0.5;
      return Math.min(1.0, stressScore);
    });
  }

  private calculatePauseRatio(intensity: number[]): number {
    const threshold = Math.max(...intensity) * 0.1;
    const pauseFrames = intensity.filter(val => val < threshold).length;
    return pauseFrames / intensity.length;
  }

  private async extractProsodyFeatures(): Promise<AudioProsodyFeatures> {
    // Extract features from current audio buffer
    const features: AudioProsodyFeatures = {
      pitch: [],
      intensity: [],
      duration: [],
      formants: { f1: [], f2: [], f3: [] },
      spectralCentroid: [],
      zeroCrossingRate: [],
      mfcc: []
    };
    
    // Process audio buffer to extract features
    for (const frame of this.audioBuffer.slice(-100)) { // Last 100 frames
      features.pitch.push(this.autocorrelationPitch(frame, this.sampleRate));
      features.intensity.push(this.calculateRMS(frame));
      features.spectralCentroid.push(this.calculateSpectralCentroid(frame));
      features.zeroCrossingRate.push(this.calculateZeroCrossingRate(frame));
    }
    
    return features;
  }

  private calculateRMS(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i];
    }
    return Math.sqrt(sum / frame.length);
  }

  private calculateSpectralCentroid(frame: Float32Array): number {
    // Simplified spectral centroid calculation
    const fft = this.simpleFFT(frame);
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateZeroCrossingRate(frame: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / frame.length;
  }

  private simpleFFT(frame: Float32Array): number[] {
    // Simplified FFT - in production would use a proper FFT library
    const N = frame.length;
    const result = new Array(N * 2);
    
    for (let k = 0; k < N; k++) {
      let realSum = 0;
      let imagSum = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        realSum += frame[n] * Math.cos(angle);
        imagSum += frame[n] * Math.sin(angle);
      }
      
      result[k * 2] = realSum;
      result[k * 2 + 1] = imagSum;
    }
    
    return result;
  }

  // Cleanup
  public dispose(): void {
    this.stopRecording();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffer = [];
    console.log('🧹 Audio service disposed');
  }
}
