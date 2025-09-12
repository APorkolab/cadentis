import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TextParserService } from '../../services/text-parser.service';
import { MLProsodyService } from '../../services/ml-prosody.service';
import { PWAService } from '../../services/pwa.service';
import { ProsodyVisualizerComponent, ProsodyData } from '../prosody-visualizer/prosody-visualizer.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, switchMap, combineLatest } from 'rxjs/operators';
import { fadeInAnimation } from '../../animations';

@Component({
  selector: 'app-quantitative-analyzer',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    TextFieldModule,
    ProsodyVisualizerComponent
  ],
  template: `
    <div class="analyzer-container" @fadeIn>
      <h1 class="title">Időmértékes Verselemzés</h1>
      <p class="subtitle">Magyar és klasszikus időmértékes prozódia real-time elemzése</p>

      <!-- Beviteli terület -->
      <mat-card class="input-section">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>edit_note</mat-icon>
            Szövegbevitel
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="fill" class="input-field">
            <mat-label>Írj vagy illeszd be versedet</mat-label>
            <textarea matInput
                      [(ngModel)]="inputText"
                      (ngModelChange)="onInputChange($event)"
                      cdkTextareaAutosize
                      cdkAutosizeMinRows="5"
                      cdkAutosizeMaxRows="20"
                      placeholder="Például:
Arma virumque cano, Troiae qui primus ab oris
Énekelj múzsám haragos Akhilleusz dicsőségéről
Eddigi kítárt hadak közt külön vitez vala"></textarea>
          </mat-form-field>
          
          <div class="quick-examples">
            <mat-chip-listbox>
              <mat-chip (click)="loadExample('hexameter')">Latin hexameter</mat-chip>
              <mat-chip (click)="loadExample('magyar')">Magyar időmértékes</mat-chip>
              <mat-chip (click)="loadExample('mixed')">Vegyes példa</mat-chip>
            </mat-chip-listbox>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Eredmények -->
      <div class="results-section" *ngIf="analysis && analysis.lines.length">
        <!-- Összesítő statisztikák -->
        <mat-card class="stats-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Összesítő
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ analysis.totalSyllables }}</div>
                <div class="stat-label">Összes szótag</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ analysis.totalMoras }}</div>
                <div class="stat-label">Összes mora</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ analysis.lines.length }}</div>
                <div class="stat-label">Sorok száma</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ getAverageLength() }}</div>
                <div class="stat-label">Átlagos sohossz</div>
              </div>
              <div class="stat-item wide">
                <div class="stat-label">Domináns ritmus</div>
                <div class="stat-value rhythm">{{ analysis.dominantRhythm }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Részletes soronkénti elemzés -->
        <mat-card class="analysis-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>format_list_bulleted</mat-icon>
              Soronkénti elemzés
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="lines-container">
              <mat-expansion-panel class="line-panel" *ngFor="let line of analysis.lines; let i = index">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <span class="line-number">{{ i + 1 }}.</span>
                    <span class="line-pattern">{{ line.pattern }}</span>
                  </mat-panel-title>
                  <mat-panel-description>
                    {{ line.syllableCount }} szótag • {{ line.moraCount }} mora
                    <span *ngIf="line.verseForm" class="verse-form">• {{ line.verseForm }}</span>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="line-details">
                  <div class="original-text">
                    <strong>Eredeti:</strong> "{{ line.text || getOriginalLine(i) }}"
                  </div>
                  
                  <div class="syllabification" *ngIf="line.syllables">
                    <strong>Szótagolás:</strong>
                    <span class="syllables">
                      <span class="syllable" 
                            *ngFor="let syl of line.syllables; let j = index"
                            [class.long]="syl.isLong"
                            [class.short]="!syl.isLong">
                        {{ syl.text }}{{ j < line.syllables.length - 1 ? '-' : '' }}
                      </span>
                    </span>
                  </div>

                  <div class="prosody-pattern">
                    <strong>Prozódiai mintázat:</strong>
                    <span class="pattern-symbols">{{ line.pattern }}</span>
                    <span class="pattern-explanation">(– = hosszú, ∪ = rövid)</span>
                  </div>

                  <div class="metric-feet" *ngIf="line.metricFeet?.length">
                    <strong>Verslábak:</strong>
                    <mat-chip-listbox>
                      <mat-chip *ngFor="let foot of line.metricFeet">{{ foot }}</mat-chip>
                    </mat-chip-listbox>
                  </div>

                  <div class="line-metrics">
                    <div class="metric-row">
                      <span class="metric-label">Szótag/Mora arány:</span>
                      <span class="metric-value">{{ (line.syllableCount / line.moraCount).toFixed(2) }}</span>
                    </div>
                    <div class="metric-row" *ngIf="line.caesura">
                      <span class="metric-label">Cezúra:</span>
                      <span class="metric-value">{{ line.caesura }} pozíció</span>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Versmértan elemzés -->
        <mat-card class="metrics-card" *ngIf="getVerseMetrics()">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>science</mat-icon>
              Versmértani elemzés
              <div class="ml-indicator" *ngIf="mlAnalysis">
                <mat-chip color="accent">ML Enhanced</mat-chip>
                <span class="confidence">{{ (mlAnalysis.overallConfidence * 100).toFixed(1) }}% biztos</span>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="metrics-grid">
              <div class="metric-section">
                <h4>Rímelés</h4>
                <p *ngIf="analysis.rhymeScheme">Rímséma: {{ analysis.rhymeScheme }}</p>
                <p *ngIf="analysis.rhymeQuality">Rímminőség: {{ analysis.rhymeQuality }}</p>
              </div>
              
              <div class="metric-section">
                <h4>Ritmus</h4>
                <p>Domináns verslábak: {{ getTopMetricFeet() }}</p>
                <p>Ritmusstabilitás: {{ getRhythmStability() }}%</p>
              </div>

              <div class="metric-section">
                <h4>Szerkezet</h4>
                <p>Versforma: {{ getDetectedVerseForm() }}</p>
                <p *ngIf="analysis.stanza">Strófaszerkezet: {{ analysis.stanza }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Advanced Visualizations -->
        <app-prosody-visualizer 
          *ngIf="visualizationData"
          [data]="visualizationData">
        </app-prosody-visualizer>
      </div>

      <!-- Üres állapot -->
      <mat-card class="empty-state" *ngIf="!analysis || !analysis.lines.length">
        <mat-card-content>
          <div class="empty-content">
            <mat-icon class="empty-icon">edit_note</mat-icon>
            <h3>Kezdj el írni!</h3>
            <p>Illeszd be vagy írj be egy verset az időmértékes elemzéshez.</p>
            <p>Az alkalmazás automatikusan felismeri a szótaghosszúságokat és verslábakat.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .analyzer-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .title {
      text-align: center;
      margin-bottom: 8px;
      color: #2c3e50;
      font-size: 2rem;
    }

    .subtitle {
      text-align: center;
      color: #7f8c8d;
      margin-bottom: 24px;
      font-size: 1.1rem;
    }

    .input-section {
      margin-bottom: 24px;
    }

    .input-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .quick-examples {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .results-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stats-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stats-card mat-card-header {
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .stat-item {
      text-align: center;
      padding: 8px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
    }

    .stat-item.wide {
      grid-column: span 2;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-value.rhythm {
      font-size: 1.1rem;
      font-family: 'Courier New', monospace;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .analysis-card {
      margin: 16px 0;
    }

    .lines-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .line-panel {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .line-number {
      font-weight: bold;
      color: #3498db;
      margin-right: 8px;
    }

    .line-pattern {
      font-family: 'Courier New', monospace;
      font-size: 1.1rem;
      color: #2c3e50;
    }

    .verse-form {
      color: #27ae60;
      font-weight: 500;
    }

    .line-details {
      padding: 16px 0;
    }

    .line-details > div {
      margin-bottom: 12px;
    }

    .original-text {
      font-size: 1rem;
      line-height: 1.4;
    }

    .syllables {
      font-family: 'Courier New', monospace;
      font-size: 1rem;
      margin-left: 8px;
    }

    .syllable {
      padding: 2px 4px;
      border-radius: 3px;
      margin: 0 1px;
    }

    .syllable.long {
      background-color: #e8f5e8;
      color: #2d5a2d;
      font-weight: 500;
    }

    .syllable.short {
      background-color: #fff3e0;
      color: #8d4500;
    }

    .pattern-symbols {
      font-family: 'Courier New', monospace;
      font-size: 1.2rem;
      font-weight: bold;
      margin-left: 8px;
      color: #2c3e50;
    }

    .pattern-explanation {
      font-size: 0.8rem;
      color: #7f8c8d;
      margin-left: 8px;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dotted #e0e0e0;
    }

    .metric-label {
      color: #7f8c8d;
    }

    .metric-value {
      font-weight: 500;
      color: #2c3e50;
    }

    .metrics-card {
      background: #f8f9fa;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .metric-section h4 {
      color: #2c3e50;
      margin-bottom: 8px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 4px;
    }

    .empty-state {
      margin-top: 24px;
      text-align: center;
      background: #fafafa;
    }

    .empty-content {
      padding: 40px;
    }

    .empty-icon {
      font-size: 48px;
      color: #bdc3c7;
      margin-bottom: 16px;
    }

    .empty-content h3 {
      color: #7f8c8d;
      margin-bottom: 8px;
    }

    .empty-content p {
      color: #95a5a6;
      line-height: 1.5;
    }

    mat-card-header mat-icon {
      margin-right: 8px;
    }

    mat-chip-listbox {
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .stat-item.wide {
        grid-column: span 2;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuantitativeAnalyzerComponent implements OnInit, OnDestroy {
  inputText = '';
  analysis: any = null;
  mlAnalysis: any = null;
  visualizationData: ProsodyData | null = null;
  isMLEnabled = true;
  
  private analysisSubject = new Subject<string>();
  private analysisSubscription!: Subscription;

  constructor(
    private textParser: TextParserService,
    private mlProsody: MLProsodyService,
    private pwaService: PWAService
  ) {}

  ngOnInit(): void {
    this.analysisSubscription = this.analysisSubject.pipe(
      debounceTime(300), 
      distinctUntilChanged(),
      tap(text => this.performAnalysis(text))
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.analysisSubscription) {
      this.analysisSubscription.unsubscribe();
    }
  }

  onInputChange(text: string): void {
    this.analysisSubject.next(text);
  }

  loadExample(type: string): void {
    const examples = {
      'hexameter': 'Arma virumque cano, Troiae qui primus ab oris\nItaliam, fato profugus, Laviniaque venit',
      'magyar': 'Eddigi kítárt hadak közt külön vitez vala\nKi mint Mátyás király járt kard élén s nyíl hegyén',
      'mixed': 'Arma virumque cano, Troiae qui primus ab oris\nÉnekelj múzsám haragos Akhilleusz dicsőségéről\nEddigi kítárt hadak közt külön vitez vala'
    };
    
    this.inputText = examples[type as keyof typeof examples] || '';
    this.performAnalysis(this.inputText);
  }

  private performAnalysis(text: string): void {
    if (!text || text.trim() === '') {
      this.analysis = null;
      this.mlAnalysis = null;
      this.visualizationData = null;
      return;
    }

    try {
      // Traditional rule-based analysis
      this.analysis = this.textParser.analyzeVerse(text);
      
      // ML-enhanced analysis
      if (this.isMLEnabled) {
        this.mlProsody.analyzeSyllablesML(text).subscribe({
          next: (mlResult) => {
            this.mlAnalysis = mlResult;
            this.updateVisualizationData();
            
            // Cache analysis offline
            const analysisId = this.generateAnalysisId(text);
            this.pwaService.cacheVerseAnalysis(analysisId, {
              traditional: this.analysis,
              ml: mlResult,
              timestamp: Date.now()
            });
          },
          error: (error) => {
            console.warn('ML analysis failed, using traditional only:', error);
            this.mlAnalysis = null;
            this.updateVisualizationData();
          }
        });
      } else {
        this.updateVisualizationData();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.analysis = null;
      this.mlAnalysis = null;
      this.visualizationData = null;
    }
  }

  getOriginalLine(index: number): string {
    if (!this.inputText) return '';
    const lines = this.inputText.split('\n');
    return lines[index] || '';
  }

  getAverageLength(): string {
    if (!this.analysis || !this.analysis.lines.length) return '0';
    const avg = this.analysis.totalSyllables / this.analysis.lines.length;
    return avg.toFixed(1);
  }

  getVerseMetrics(): boolean {
    return this.analysis && (this.analysis.rhymeScheme || this.analysis.dominantRhythm);
  }

  getTopMetricFeet(): string {
    if (!this.analysis || !this.analysis.lines) return 'Nincs adat';
    
    const feet: { [key: string]: number } = {};
    this.analysis.lines.forEach((line: any) => {
      if (line.metricFeet) {
        line.metricFeet.forEach((foot: string) => {
          feet[foot] = (feet[foot] || 0) + 1;
        });
      }
    });

    const topFeet = Object.entries(feet)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([foot]) => foot);
      
    return topFeet.length ? topFeet.join(', ') : 'Nincs adat';
  }

  getRhythmStability(): number {
    if (!this.analysis || !this.analysis.lines) return 0;
    
    // Egyszerű stabilitási mérték - hány sor követi a domináns ritmust
    const dominantRhythm = this.analysis.dominantRhythm;
    if (!dominantRhythm) return 0;

    const matchingLines = this.analysis.lines.filter((line: any) => 
      line.pattern === dominantRhythm
    ).length;
    
    return Math.round((matchingLines / this.analysis.lines.length) * 100);
  }

  getDetectedVerseForm(): string {
    if (!this.analysis || !this.analysis.lines) return 'Ismeretlen';
    
    // Egyszerű versforma felismerés
    const avgSyllables = this.analysis.totalSyllables / this.analysis.lines.length;
    const dominantPattern = this.analysis.dominantRhythm;
    
    if (avgSyllables > 11 && avgSyllables < 13) {
      if (dominantPattern?.includes('–∪∪')) return 'Hexameter';
      return 'Alexandrin';
    } else if (avgSyllables > 10 && avgSyllables < 12) {
      return 'Endecasillabo';
    } else if (avgSyllables > 7 && avgSyllables < 9) {
      return 'Oktossillabus';
    }
    
    return `${Math.round(avgSyllables)} szótagos vers`;
  }

  private updateVisualizationData(): void {
    if (!this.analysis) return;
    
    const syllables = this.mlAnalysis ? 
      this.mlAnalysis.syllables.map((syl: any, i: number) => ({
        text: syl.text,
        isLong: syl.isLong,
        confidence: syl.confidence,
        position: i,
        stress: syl.stress || 0,
        mora: syl.isLong ? 2 : 1
      })) :
      this.analysis.lines.flatMap((line: any, lineIndex: number) => 
        line.syllables?.map((syl: any, syllIndex: number) => ({
          text: syl.text || '',
          isLong: syl.isLong || false,
          confidence: 0.8, // Default confidence for rule-based
          position: lineIndex * 100 + syllIndex, // Unique position
          stress: syllIndex === 0 ? 1.0 : 0.3, // Hungarian first syllable stress
          mora: (syl.isLong || false) ? 2 : 1
        })) || []
      );

    this.visualizationData = {
      syllables,
      lines: this.analysis.lines.map((line: any) => ({
        pattern: line.pattern || '',
        syllables: line.syllables || [],
        moraCount: line.moraCount || 0
      }))
    };
  }

  private generateAnalysisId(text: string): string {
    // Simple hash function for analysis ID
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `analysis_${Math.abs(hash).toString(36)}`;
  }

  toggleMLAnalysis(): void {
    this.isMLEnabled = !this.isMLEnabled;
    if (this.inputText) {
      this.performAnalysis(this.inputText);
    }
  }

  shareAnalysis(): void {
    if (!this.analysis) return;
    
    const shareContent = {
      title: 'Cadentis - Magyar Verselemzés',
      text: `Elemzett szöveg: "${this.inputText.substring(0, 50)}..."\n` +
            `Szótagok: ${this.analysis.totalSyllables}, Morák: ${this.analysis.totalMoras}\n` +
            `Domináns ritmus: ${this.analysis.dominantRhythm || 'Ismeretlen'}`,
      url: window.location.href
    };
    
    this.pwaService.shareContent(shareContent);
  }

  saveOffline(): void {
    if (!this.analysis) return;
    
    const saveData = {
      text: this.inputText,
      analysis: this.analysis,
      mlAnalysis: this.mlAnalysis,
      timestamp: Date.now()
    };
    
    this.pwaService.addToOfflineQueue('save-analysis', saveData);
    this.pwaService.showNotification({
      title: 'Elemzés mentve',
      body: 'Az elemzés offline elérhetővé vált.'
    });
  }
}
