import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PerformanceService } from '../../services/performance.service';
import { PWAService } from '../../services/pwa.service';
import * as d3 from 'd3';
import { fadeInAnimation } from '../../animations';

export interface AnalyticsData {
  usage: {
    totalAnalyses: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    popularFeatures: { feature: string; usage: number }[];
    userRetention: { period: string; rate: number }[];
  };
  performance: {
    avgLoadTime: number;
    avgAnalysisTime: number;
    errorRate: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
  content: {
    mostAnalyzedTexts: { text: string; count: number }[];
    popularMeter: { meter: string; frequency: number }[];
    languageDistribution: { language: string; percentage: number }[];
    difficultyLevels: { level: string; count: number }[];
  };
  ml: {
    modelAccuracy: number;
    predictionConfidence: number;
    trainingProgress: number;
    featureImportance: { feature: string; importance: number }[];
  };
  collaboration: {
    activeUsers: number;
    sessionsCreated: number;
    avgCollaborators: number;
    sharedAnalyses: number;
  };
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    FormsModule
  ],
  template: `
    <div class="analytics-container" @fadeIn>
      <div class="header">
        <h1>📊 Cadentis Analytics</h1>
        <div class="header-controls">
          <mat-form-field>
            <mat-label>Időszak</mat-label>
            <mat-select [(value)]="selectedPeriod" (selectionChange)="refreshData()">
              <mat-option value="day">Ma</mat-option>
              <mat-option value="week">Hét</mat-option>
              <mat-option value="month">Hónap</mat-option>
              <mat-option value="year">Év</mat-option>
            </mat-select>
          </mat-form-field>
          
          <button mat-raised-button color="primary" (click)="exportReport()">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </div>

      <mat-tab-group class="analytics-tabs">
        <!-- Overview Tab -->
        <mat-tab label="Áttekintés">
          <div class="tab-content">
            <div class="metrics-grid">
              <mat-card class="metric-card usage">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>analytics</mat-icon>
                    Használat
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-value">{{ analytics?.usage.totalAnalyses | number }}</div>
                  <div class="metric-label">Összes elemzés</div>
                  
                  <div class="sub-metrics">
                    <div class="sub-metric">
                      <span class="value">{{ analytics?.usage.uniqueUsers | number }}</span>
                      <span class="label">Egyedi felhasználó</span>
                    </div>
                    <div class="sub-metric">
                      <span class="value">{{ formatDuration(analytics?.usage.avgSessionDuration || 0) }}</span>
                      <span class="label">Átl. munkamenet</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="metric-card performance">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>speed</mat-icon>
                    Teljesítmény
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-value">{{ analytics?.performance.avgLoadTime | number:'1.1-1' }}ms</div>
                  <div class="metric-label">Átl. betöltési idő</div>
                  
                  <div class="sub-metrics">
                    <div class="sub-metric">
                      <span class="value">{{ (analytics?.performance.errorRate || 0) * 100 | number:'1.1-1' }}%</span>
                      <span class="label">Hibaarány</span>
                    </div>
                    <div class="sub-metric">
                      <span class="value">{{ (analytics?.performance.cacheHitRate || 0) * 100 | number:'1.1-1' }}%</span>
                      <span class="label">Cache találat</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="metric-card ml">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>psychology</mat-icon>
                    AI/ML
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-value">{{ (analytics?.ml.modelAccuracy || 0) * 100 | number:'1.1-1' }}%</div>
                  <div class="metric-label">Modell pontosság</div>
                  
                  <div class="sub-metrics">
                    <div class="sub-metric">
                      <span class="value">{{ (analytics?.ml.predictionConfidence || 0) * 100 | number:'1.1-1' }}%</span>
                      <span class="label">Predikció bizalom</span>
                    </div>
                    <div class="sub-metric">
                      <span class="value">{{ (analytics?.ml.trainingProgress || 0) * 100 | number:'1.0-0' }}%</span>
                      <span class="label">Tanulás állapota</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="metric-card collaboration">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>people</mat-icon>
                    Kollaboráció
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-value">{{ analytics?.collaboration.activeUsers | number }}</div>
                  <div class="metric-label">Aktív felhasználó</div>
                  
                  <div class="sub-metrics">
                    <div class="sub-metric">
                      <span class="value">{{ analytics?.collaboration.sessionsCreated | number }}</span>
                      <span class="label">Új munkamenet</span>
                    </div>
                    <div class="sub-metric">
                      <span class="value">{{ analytics?.collaboration.avgCollaborators | number:'1.1-1' }}</span>
                      <span class="label">Átl. együttműködő</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Trend Charts -->
            <div class="charts-grid">
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Használati trend</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container" #usageTrendChart></div>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Teljesítmény metrikák</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container" #performanceChart></div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Content Analytics Tab -->
        <mat-tab label="Tartalom elemzés">
          <div class="tab-content">
            <div class="content-analytics-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Legnépszerűbb versformák</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="popular-meters">
                    <div class="meter-item" *ngFor="let meter of analytics?.content.popularMeter">
                      <div class="meter-name">{{ meter.meter }}</div>
                      <div class="meter-bar">
                        <div class="meter-fill" [style.width.%]="(meter.frequency / getMaxMeterFrequency()) * 100"></div>
                      </div>
                      <div class="meter-count">{{ meter.frequency }}</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Nyelvek eloszlása</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="language-distribution" #languageChart></div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Legnépszerűbb szövegek</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-table [dataSource]="analytics?.content.mostAnalyzedTexts || []">
                    <ng-container matColumnDef="text">
                      <mat-header-cell *matHeaderCellDef>Szöveg</mat-header-cell>
                      <mat-cell *matCellDef="let element">
                        {{ element.text.length > 50 ? element.text.substring(0, 50) + '...' : element.text }}
                      </mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="count">
                      <mat-header-cell *matHeaderCellDef>Elemzés</mat-header-cell>
                      <mat-cell *matCellDef="let element">{{ element.count }}</mat-cell>
                    </ng-container>
                    
                    <mat-header-row *matHeaderRowDef="['text', 'count']"></mat-header-row>
                    <mat-row *matRowDef="let row; columns: ['text', 'count']"></mat-row>
                  </mat-table>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Nehézségi szintek</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="difficulty-chart" #difficultyChart></div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- ML Insights Tab -->
        <mat-tab label="ML Betekintések">
          <div class="tab-content">
            <div class="ml-insights-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Modell teljesítmény</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="ml-performance-metrics">
                    <div class="ml-metric">
                      <div class="ml-metric-label">Pontosság</div>
                      <div class="ml-metric-value">{{ (analytics?.ml.modelAccuracy || 0) * 100 | number:'1.2-2' }}%</div>
                      <mat-progress-bar [value]="(analytics?.ml.modelAccuracy || 0) * 100" color="primary"></mat-progress-bar>
                    </div>
                    
                    <div class="ml-metric">
                      <div class="ml-metric-label">Konfidencia</div>
                      <div class="ml-metric-value">{{ (analytics?.ml.predictionConfidence || 0) * 100 | number:'1.2-2' }}%</div>
                      <mat-progress-bar [value]="(analytics?.ml.predictionConfidence || 0) * 100" color="accent"></mat-progress-bar>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Feature fontosság</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="feature-importance" #featureImportanceChart></div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Előrejelzési hibák</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="error-analysis">
                    <p>Top hibatípusok:</p>
                    <mat-chip-set>
                      <mat-chip>Hosszú/rövid felcserélés</mat-chip>
                      <mat-chip>Mássalhangzó klaszterek</mat-chip>
                      <mat-chip>Idegen szavak</mat-chip>
                      <mat-chip>Összetett szavak</mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Tanulási görbe</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="learning-curve" #learningCurveChart></div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Real-time Tab -->
        <mat-tab label="Valós idejű">
          <div class="tab-content">
            <div class="realtime-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Élő aktivitás</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="live-activity">
                    <div class="activity-feed">
                      <div class="activity-item" *ngFor="let activity of liveActivities">
                        <mat-icon [color]="getActivityColor(activity.type)">{{ getActivityIcon(activity.type) }}</mat-icon>
                        <span class="activity-text">{{ activity.description }}</span>
                        <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Aktív munkamenetek</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="active-sessions">
                    <div class="session-counter">
                      <mat-icon>people</mat-icon>
                      <span class="count">{{ activeSessions }}</span>
                      <span class="label">aktív munkamenet</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Rendszer állapot</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="system-status">
                    <div class="status-item">
                      <mat-icon color="primary">cloud</mat-icon>
                      <span>API státusz: Működik</span>
                    </div>
                    <div class="status-item">
                      <mat-icon color="primary">storage</mat-icon>
                      <span>Adatbázis: Elérhető</span>
                    </div>
                    <div class="status-item">
                      <mat-icon color="primary">psychology</mat-icon>
                      <span>ML Service: Online</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 300;
    }

    .header-controls {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .analytics-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tab-content {
      padding: 24px;
      min-height: 600px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      border-radius: 12px;
      overflow: hidden;
    }

    .metric-card.usage { border-top: 4px solid #3498db; }
    .metric-card.performance { border-top: 4px solid #e74c3c; }
    .metric-card.ml { border-top: 4px solid #9b59b6; }
    .metric-card.collaboration { border-top: 4px solid #2ecc71; }

    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #2c3e50;
      line-height: 1;
      margin-bottom: 4px;
    }

    .metric-label {
      color: #7f8c8d;
      font-size: 0.9rem;
      margin-bottom: 16px;
    }

    .sub-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .sub-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .sub-metric .value {
      font-size: 1.2rem;
      font-weight: 600;
      color: #34495e;
    }

    .sub-metric .label {
      font-size: 0.75rem;
      color: #7f8c8d;
      text-align: center;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 16px;
    }

    .chart-card {
      border-radius: 12px;
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }

    .content-analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .popular-meters {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .meter-item {
      display: grid;
      grid-template-columns: 120px 1fr 60px;
      gap: 12px;
      align-items: center;
    }

    .meter-name {
      font-weight: 500;
      color: #34495e;
    }

    .meter-bar {
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      position: relative;
    }

    .meter-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2ecc71);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .meter-count {
      text-align: right;
      font-weight: 500;
      color: #7f8c8d;
    }

    .ml-insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
    }

    .ml-performance-metrics {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .ml-metric {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ml-metric-label {
      font-weight: 500;
      color: #34495e;
    }

    .ml-metric-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .error-analysis {
      padding: 16px 0;
    }

    .error-analysis p {
      margin-bottom: 12px;
      color: #34495e;
      font-weight: 500;
    }

    .realtime-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .activity-feed {
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .activity-text {
      flex: 1;
      color: #34495e;
    }

    .activity-time {
      font-size: 0.8rem;
      color: #95a5a6;
    }

    .session-counter {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
    }

    .session-counter .count {
      font-size: 3rem;
      font-weight: bold;
      color: #2ecc71;
    }

    .session-counter .label {
      color: #7f8c8d;
    }

    .system-status {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    @media (max-width: 768px) {
      .analytics-container {
        padding: 16px;
      }
      
      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-controls {
        justify-content: center;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  analytics: AnalyticsData | null = null;
  selectedPeriod = 'month';
  isLoading = true;
  activeSessions = 0;
  
  liveActivities = [
    { type: 'analysis', description: 'Új verselemzés indítva', timestamp: Date.now() - 30000 },
    { type: 'collaboration', description: 'Felhasználó csatlakozott munkamenethez', timestamp: Date.now() - 120000 },
    { type: 'ml', description: 'ML modell újratanítva', timestamp: Date.now() - 300000 },
    { type: 'export', description: 'Elemzés exportálva', timestamp: Date.now() - 450000 }
  ];

  constructor(
    private performanceService: PerformanceService,
    private pwaService: PWAService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
    this.startLiveUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadAnalytics(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Simulate loading analytics data
      await this.delay(1500);
      
      this.analytics = {
        usage: {
          totalAnalyses: 15420,
          uniqueUsers: 3241,
          avgSessionDuration: 847000, // milliseconds
          popularFeatures: [
            { feature: 'Időmértékes elemzés', usage: 8543 },
            { feature: 'Vizualizáció', usage: 6234 },
            { feature: 'AI javaslatok', usage: 4532 },
            { feature: 'Kollaboráció', usage: 2341 }
          ],
          userRetention: [
            { period: '1 nap', rate: 0.85 },
            { period: '1 hét', rate: 0.67 },
            { period: '1 hónap', rate: 0.45 }
          ]
        },
        performance: {
          avgLoadTime: 1247,
          avgAnalysisTime: 234,
          errorRate: 0.023,
          cacheHitRate: 0.89,
          memoryUsage: 67.5
        },
        content: {
          mostAnalyzedTexts: [
            { text: 'Arma virumque cano, Troiae qui primus ab oris', count: 234 },
            { text: 'Eddigi kítárt hadak közt külön vitez vala', count: 198 },
            { text: 'Énekelj múzsám haragos Akhilleusz dicsőségéről', count: 156 }
          ],
          popularMeter: [
            { meter: 'Hexameter', frequency: 3421 },
            { meter: 'Jambikus pentameter', frequency: 2987 },
            { meter: 'Trochaikus tetrameter', frequency: 2543 },
            { meter: 'Spondeus', frequency: 1876 }
          ],
          languageDistribution: [
            { language: 'Magyar', percentage: 45.6 },
            { language: 'Latin', percentage: 32.1 },
            { language: 'Görög', percentage: 22.3 }
          ],
          difficultyLevels: [
            { level: 'Kezdő', count: 4523 },
            { level: 'Középhaladó', count: 7234 },
            { level: 'Haladó', count: 3663 }
          ]
        },
        ml: {
          modelAccuracy: 0.947,
          predictionConfidence: 0.892,
          trainingProgress: 0.78,
          featureImportance: [
            { feature: 'Magánhangzó hossz', importance: 0.34 },
            { feature: 'Mássalhangzó klaszter', importance: 0.28 },
            { feature: 'Szótag pozíció', importance: 0.19 },
            { feature: 'Szó hossz', importance: 0.12 },
            { feature: 'Kontextus', importance: 0.07 }
          ]
        },
        collaboration: {
          activeUsers: 127,
          sessionsCreated: 456,
          avgCollaborators: 2.7,
          sharedAnalyses: 1234
        }
      };
      
      this.activeSessions = this.analytics.collaboration.activeUsers;
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      this.isLoading = false;
      this.createCharts();
    }
  }

  private startLiveUpdates(): void {
    setInterval(() => {
      // Simulate real-time activity
      if (Math.random() < 0.3) {
        const activities = [
          { type: 'analysis', description: 'Új verselemzés indítva' },
          { type: 'collaboration', description: 'Felhasználó csatlakozott' },
          { type: 'ml', description: 'AI javaslat generálva' },
          { type: 'export', description: 'Eredmény exportálva' }
        ];
        
        const newActivity = activities[Math.floor(Math.random() * activities.length)];
        this.liveActivities.unshift({
          ...newActivity,
          timestamp: Date.now()
        });
        
        // Keep only last 10 activities
        this.liveActivities = this.liveActivities.slice(0, 10);
      }
      
      // Update active sessions with some variation
      this.activeSessions += Math.floor(Math.random() * 10 - 5);
      this.activeSessions = Math.max(50, Math.min(200, this.activeSessions));
      
    }, 5000);
  }

  private createCharts(): void {
    // Implementation would create D3.js charts
    setTimeout(() => {
      this.createUsageTrendChart();
      this.createPerformanceChart();
      this.createLanguageChart();
      this.createDifficultyChart();
      this.createFeatureImportanceChart();
      this.createLearningCurveChart();
    }, 100);
  }

  private createUsageTrendChart(): void {
    // D3.js line chart for usage trends
    console.log('Creating usage trend chart');
  }

  private createPerformanceChart(): void {
    // D3.js multi-line chart for performance metrics
    console.log('Creating performance chart');
  }

  private createLanguageChart(): void {
    // D3.js pie chart for language distribution
    console.log('Creating language distribution chart');
  }

  private createDifficultyChart(): void {
    // D3.js bar chart for difficulty levels
    console.log('Creating difficulty levels chart');
  }

  private createFeatureImportanceChart(): void {
    // D3.js horizontal bar chart for ML feature importance
    console.log('Creating feature importance chart');
  }

  private createLearningCurveChart(): void {
    // D3.js line chart for ML learning curve
    console.log('Creating learning curve chart');
  }

  refreshData(): void {
    this.loadAnalytics();
  }

  exportReport(): void {
    const reportData = {
      period: this.selectedPeriod,
      generatedAt: new Date().toISOString(),
      analytics: this.analytics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cadentis-analytics-${this.selectedPeriod}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  getMaxMeterFrequency(): number {
    if (!this.analytics?.content.popularMeter.length) return 1;
    return Math.max(...this.analytics.content.popularMeter.map(m => m.frequency));
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}ó`;
    if (minutes > 0) return `${minutes}p`;
    return 'most';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      analysis: 'analytics',
      collaboration: 'people',
      ml: 'psychology',
      export: 'download'
    };
    return icons[type] || 'info';
  }

  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      analysis: 'primary',
      collaboration: 'accent',
      ml: 'warn',
      export: 'primary'
    };
    return colors[type] || 'primary';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
