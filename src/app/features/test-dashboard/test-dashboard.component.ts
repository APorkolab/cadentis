import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TestRunnerService, TestSuite, TestCase, TestReport, AITestGeneratorConfig, TestResult } from '../../services/test-runner.service';
import { fadeInAnimation, scaleInAnimation, listAnimation } from '../../animations';

@Component({
  selector: 'app-test-dashboard',
  standalone: true,
  animations: [fadeInAnimation, scaleInAnimation, listAnimation],
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatExpansionModule,
    MatBadgeModule,
    FormsModule
  ],
  template: `
    <div class="test-dashboard" @fadeIn>
      <div class="dashboard-header">
        <h1>🧪 Cadentis Test Center</h1>
        <div class="header-controls">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="runAllTests()"
            [disabled]="isRunning"
            matTooltip="Összes teszt futtatása">
            <mat-icon>play_arrow</mat-icon>
            {{ isRunning ? 'Futtatás...' : 'Összes teszt' }}
          </button>
          
          <button 
            mat-raised-button 
            color="accent" 
            (click)="generateAITests()"
            [disabled]="isGeneratingTests"
            matTooltip="AI-alapú tesztek generálása">
            <mat-icon>psychology</mat-icon>
            {{ isGeneratingTests ? 'Generálás...' : 'AI tesztek' }}
          </button>
          
          <button 
            mat-stroked-button
            (click)="exportTestReport()"
            [disabled]="!currentReport"
            matTooltip="Teszt riport exportálása">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </div>

      <div class="status-bar" *ngIf="isRunning" @scaleIn>
        <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
        <div class="status-text">
          <mat-icon>hourglass_empty</mat-icon>
          <span>Tesztek futtatása...</span>
        </div>
      </div>

      <mat-tab-group class="test-tabs" animationDuration="300ms">
        <!-- Test Suites Tab -->
        <mat-tab label="Teszt csoportok" [badgeHidden]="testSuites.length === 0" [matBadge]="testSuites.length">
          <div class="tab-content">
            <div class="overview-metrics" @listAnimation>
              <mat-card class="metric-card">
                <mat-card-content>
                  <div class="metric-header">
                    <mat-icon color="primary">folder</mat-icon>
                    <span class="metric-label">Teszt csoportok</span>
                  </div>
                  <div class="metric-value">{{ testSuites.length }}</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="metric-card">
                <mat-card-content>
                  <div class="metric-header">
                    <mat-icon color="accent">fact_check</mat-icon>
                    <span class="metric-label">Összes teszt</span>
                  </div>
                  <div class="metric-value">{{ getTotalTestCount() }}</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="metric-card">
                <mat-card-content>
                  <div class="metric-header">
                    <mat-icon color="warn">psychology</mat-icon>
                    <span class="metric-label">AI tesztek</span>
                  </div>
                  <div class="metric-value">{{ getAITestCount() }}</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="metric-card" *ngIf="currentReport">
                <mat-card-content>
                  <div class="metric-header">
                    <mat-icon [color]="getOverallHealthColor()">speed</mat-icon>
                    <span class="metric-label">Átlagos sikerráta</span>
                  </div>
                  <div class="metric-value">{{ getOverallSuccessRate() }}%</div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="suites-grid">
              <mat-card 
                class="suite-card" 
                *ngFor="let suite of testSuites; trackBy: trackBySuite"
                @scaleIn>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>folder_open</mat-icon>
                    {{ suite.name }}
                  </mat-card-title>
                  <mat-card-subtitle>{{ suite.description }}</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="suite-stats">
                    <div class="stat-chip">
                      <mat-chip-set>
                        <mat-chip color="primary">
                          <mat-icon matChipAvatar>fact_check</mat-icon>
                          {{ suite.tests.length }} teszt
                        </mat-chip>
                        <mat-chip color="accent" *ngIf="getAITestsInSuite(suite) > 0">
                          <mat-icon matChipAvatar>psychology</mat-icon>
                          {{ getAITestsInSuite(suite) }} AI
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                    
                    <div class="test-categories">
                      <div class="category" *ngFor="let category of getUniqueCategories(suite.tests)">
                        <span class="category-label">{{ getCategoryLabel(category) }}</span>
                        <span class="category-count">{{ getTestsByCategory(suite.tests, category).length }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button color="primary" (click)="runTestSuite(suite.id)">
                    <mat-icon>play_arrow</mat-icon>
                    Futtatás
                  </button>
                  <button mat-button (click)="viewTestDetails(suite)">
                    <mat-icon>visibility</mat-icon>
                    Részletek
                  </button>
                  <button mat-button color="warn" (click)="generateTestsForSuite(suite)">
                    <mat-icon>psychology</mat-icon>
                    AI tesztek
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Test Results Tab -->
        <mat-tab label="Eredmények" [badgeHidden]="!currentReport" matBadge="!">
          <div class="tab-content" *ngIf="currentReport">
            <div class="results-header">
              <h3>
                <mat-icon>assessment</mat-icon>
                Teszt eredmények
              </h3>
              <div class="results-summary">
                <mat-chip-set>
                  <mat-chip color="primary" [selected]="true">
                    <mat-icon matChipAvatar>done</mat-icon>
                    {{ currentReport.summary.passed }} sikeres
                  </mat-chip>
                  <mat-chip color="warn" [selected]="currentReport.summary.failed > 0">
                    <mat-icon matChipAvatar>error</mat-icon>
                    {{ currentReport.summary.failed }} hibás
                  </mat-chip>
                  <mat-chip *ngIf="currentReport.summary.skipped > 0">
                    <mat-icon matChipAvatar>skip_next</mat-icon>
                    {{ currentReport.summary.skipped }} kihagyva
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>

            <div class="coverage-section">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Kódlefedettség</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="coverage-metrics">
                    <div class="coverage-item">
                      <label>Sorok</label>
                      <mat-progress-bar 
                        [value]="currentReport.summary.coverage.lines" 
                        [color]="getCoverageColor(currentReport.summary.coverage.lines)">
                      </mat-progress-bar>
                      <span>{{ currentReport.summary.coverage.lines }}%</span>
                    </div>
                    
                    <div class="coverage-item">
                      <label>Függvények</label>
                      <mat-progress-bar 
                        [value]="currentReport.summary.coverage.functions" 
                        [color]="getCoverageColor(currentReport.summary.coverage.functions)">
                      </mat-progress-bar>
                      <span>{{ currentReport.summary.coverage.functions }}%</span>
                    </div>
                    
                    <div class="coverage-item">
                      <label>Elágazások</label>
                      <mat-progress-bar 
                        [value]="currentReport.summary.coverage.branches" 
                        [color]="getCoverageColor(currentReport.summary.coverage.branches)">
                      </mat-progress-bar>
                      <span>{{ currentReport.summary.coverage.branches }}%</span>
                    </div>
                    
                    <div class="coverage-item overall">
                      <label>Összesített</label>
                      <mat-progress-bar 
                        [value]="currentReport.summary.coverage.overall" 
                        [color]="getCoverageColor(currentReport.summary.coverage.overall)"
                        mode="determinate">
                      </mat-progress-bar>
                      <span class="overall-value">{{ currentReport.summary.coverage.overall }}%</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="detailed-results">
              <mat-expansion-panel 
                *ngFor="let result of currentReport.results; trackBy: trackByResult"
                class="result-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon [color]="result.passed ? 'primary' : 'warn'">
                      {{ result.passed ? 'check_circle' : 'error' }}
                    </mat-icon>
                    {{ getTestName(result.testId) }}
                  </mat-panel-title>
                  <mat-panel-description>
                    {{ result.duration }}ms
                    <mat-chip-set>
                      <mat-chip [color]="result.passed ? 'primary' : 'warn'" selected>
                        {{ result.passed ? 'Sikeres' : 'Hibás' }}
                      </mat-chip>
                    </mat-chip-set>
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="result-details">
                  <div class="assertions" *ngIf="result.assertions.length > 0">
                    <h4>Ellenőrzések</h4>
                    <div class="assertion-list">
                      <div 
                        class="assertion-item"
                        *ngFor="let assertion of result.assertions"
                        [class.passed]="assertion.passed"
                        [class.failed]="!assertion.passed">
                        <mat-icon>{{ assertion.passed ? 'check' : 'close' }}</mat-icon>
                        <span>{{ assertion.description }}</span>
                        <span class="assertion-error" *ngIf="assertion.error">{{ assertion.error }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="performance-details" *ngIf="result.performance">
                    <h4>Teljesítmény</h4>
                    <div class="perf-metrics">
                      <div class="perf-item">
                        <label>Memória:</label>
                        <span>{{ result.performance.memoryUsage }}MB</span>
                      </div>
                      <div class="perf-item">
                        <label>CPU idő:</label>
                        <span>{{ result.performance.cpuTime }}ms</span>
                      </div>
                      <div class="perf-item">
                        <label>Hálózati kérések:</label>
                        <span>{{ result.performance.networkRequests }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="error-details" *ngIf="result.error">
                    <h4>Hiba részletei</h4>
                    <pre class="error-message">{{ result.error }}</pre>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>
          </div>
          
          <div class="no-results" *ngIf="!currentReport">
            <mat-icon>assessment</mat-icon>
            <h3>Nincs elérhető teszt eredmény</h3>
            <p>Futtasson teszteket az eredmények megtekintéséhez.</p>
          </div>
        </mat-tab>

        <!-- AI Configuration Tab -->
        <mat-tab label="AI beállítások">
          <div class="tab-content">
            <mat-card class="config-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>psychology</mat-icon>
                  AI teszt generátor beállítások
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <div class="config-form">
                  <mat-slide-toggle 
                    [(ngModel)]="aiConfig.enabled"
                    (change)="updateAIConfig()">
                    AI teszt generálás engedélyezése
                  </mat-slide-toggle>
                  
                  <mat-form-field>
                    <mat-label>AI modell</mat-label>
                    <mat-select [(ngModel)]="aiConfig.model" (selectionChange)="updateAIConfig()">
                      <mat-option value="gpt-4">GPT-4</mat-option>
                      <mat-option value="claude">Claude</mat-option>
                      <mat-option value="local">Helyi modell</mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <mat-form-field>
                    <mat-label>Maximum tesztek komponensenként</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [(ngModel)]="aiConfig.maxTestsPerComponent"
                      (ngModelChange)="updateAIConfig()"
                      min="1" max="50">
                  </mat-form-field>
                  
                  <div class="test-type-options">
                    <h4>Teszt típusok</h4>
                    
                    <mat-slide-toggle 
                      [(ngModel)]="aiConfig.includeEdgeCases"
                      (change)="updateAIConfig()">
                      Szélsőséges esetek
                    </mat-slide-toggle>
                    
                    <mat-slide-toggle 
                      [(ngModel)]="aiConfig.includePerformanceTests"
                      (change)="updateAIConfig()">
                      Teljesítmény tesztek
                    </mat-slide-toggle>
                    
                    <mat-slide-toggle 
                      [(ngModel)]="aiConfig.includeAccessibilityTests"
                      (change)="updateAIConfig()">
                      Akadálymentesség tesztek
                    </mat-slide-toggle>
                    
                    <mat-slide-toggle 
                      [(ngModel)]="aiConfig.includeSecurityTests"
                      (change)="updateAIConfig()">
                      Biztonsági tesztek
                    </mat-slide-toggle>
                  </div>
                  
                  <mat-form-field>
                    <mat-label>Megbízhatósági küszöb</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [(ngModel)]="aiConfig.confidenceThreshold"
                      (ngModelChange)="updateAIConfig()"
                      min="0" max="1" step="0.1">
                    <mat-hint>0.0 - 1.0 közötti érték</mat-hint>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="recommendations-card" *ngIf="currentReport && currentReport.recommendations.length > 0">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>lightbulb</mat-icon>
                  Javaslatok
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <div class="recommendations-list">
                  <div class="recommendation" *ngFor="let recommendation of currentReport.recommendations">
                    <mat-icon color="accent">tips_and_updates</mat-icon>
                    <span>{{ recommendation }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Performance Tab -->
        <mat-tab label="Teljesítmény" *ngIf="currentReport">
          <div class="tab-content">
            <div class="performance-overview">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Teljesítmény áttekintés</mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="perf-grid">
                    <div class="perf-metric">
                      <mat-icon color="primary">memory</mat-icon>
                      <div class="metric-info">
                        <span class="metric-label">Összes memória</span>
                        <span class="metric-value">{{ currentReport.performance.totalMemory }}MB</span>
                      </div>
                    </div>
                    
                    <div class="perf-metric">
                      <mat-icon color="warn">trending_up</mat-icon>
                      <div class="metric-info">
                        <span class="metric-label">Csúcs memória</span>
                        <span class="metric-value">{{ currentReport.performance.peakMemory }}MB</span>
                      </div>
                    </div>
                    
                    <div class="perf-metric">
                      <mat-icon color="accent">speed</mat-icon>
                      <div class="metric-info">
                        <span class="metric-label">Átlagos válaszidő</span>
                        <span class="metric-value">{{ currentReport.performance.avgResponseTime.toFixed(0) }}ms</span>
                      </div>
                    </div>
                    
                    <div class="perf-metric">
                      <mat-icon color="primary">schedule</mat-icon>
                      <div class="metric-info">
                        <span class="metric-label">Teljes időtartam</span>
                        <span class="metric-value">{{ currentReport.summary.duration.toFixed(0) }}ms</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="performance-chart" #performanceChart>
              <!-- D3.js chart would be rendered here -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Teszt teljesítmény trend</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-placeholder">
                    <mat-icon>show_chart</mat-icon>
                    <p>Teljesítmény grafikon (D3.js implementáció szükséges)</p>
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
    .test-dashboard {
      padding: 24px;
      max-width: 1800px;
      margin: 0 auto;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .dashboard-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 300;
    }

    .header-controls {
      display: flex;
      gap: 12px;
    }

    .status-bar {
      margin-bottom: 16px;
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .status-text {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: #666;
    }

    .test-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tab-content {
      padding: 24px;
      min-height: 600px;
    }

    .overview-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card .metric-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 0.9rem;
      color: #666;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .suites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
    }

    .suite-card {
      transition: transform 0.2s ease-in-out;
    }

    .suite-card:hover {
      transform: translateY(-2px);
    }

    .suite-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .test-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .category {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #f0f2f5;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .category-label {
      color: #555;
    }

    .category-count {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 6px;
      border-radius: 8px;
      font-weight: 500;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .results-summary {
      display: flex;
      gap: 8px;
    }

    .coverage-section {
      margin-bottom: 24px;
    }

    .coverage-metrics {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .coverage-item {
      display: grid;
      grid-template-columns: 120px 1fr 60px;
      gap: 16px;
      align-items: center;
    }

    .coverage-item label {
      font-weight: 500;
      color: #555;
    }

    .coverage-item.overall {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
      margin-top: 8px;
    }

    .overall-value {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .detailed-results {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .result-panel {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .result-details {
      padding: 16px 0;
    }

    .result-details h4 {
      color: #2c3e50;
      margin: 0 0 12px 0;
      font-size: 1rem;
    }

    .assertion-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .assertion-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .assertion-item.passed {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .assertion-item.failed {
      background: #ffebee;
      color: #c62828;
    }

    .assertion-error {
      font-style: italic;
      opacity: 0.8;
    }

    .perf-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .perf-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .perf-item label {
      color: #666;
    }

    .error-message {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #f44336;
      font-size: 0.9rem;
      color: #c62828;
      overflow-x: auto;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: #999;
    }

    .no-results mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
    }

    .config-card, .recommendations-card {
      margin-bottom: 16px;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 500px;
    }

    .test-type-options {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
    }

    .test-type-options h4 {
      margin: 0 0 12px 0;
      color: #2c3e50;
    }

    .test-type-options mat-slide-toggle {
      display: block;
      margin-bottom: 8px;
    }

    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .recommendation {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #fff3e0;
      border-radius: 8px;
      border-left: 4px solid #ff9800;
    }

    .performance-overview {
      margin-bottom: 24px;
    }

    .perf-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .perf-metric {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-info .metric-label {
      font-size: 0.8rem;
      color: #666;
    }

    .metric-info .metric-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: #999;
    }

    .chart-placeholder mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .test-dashboard {
        padding: 16px;
      }
      
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
      }
      
      .overview-metrics {
        grid-template-columns: 1fr;
      }
      
      .suites-grid {
        grid-template-columns: 1fr;
      }
      
      .coverage-item {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }
  `]
})
export class TestDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  testSuites: TestSuite[] = [];
  currentReport: TestReport | null = null;
  isRunning = false;
  isGeneratingTests = false;
  aiConfig: AITestGeneratorConfig = {
    enabled: true,
    model: 'gpt-4',
    maxTestsPerComponent: 10,
    includeEdgeCases: true,
    includePerformanceTests: true,
    includeAccessibilityTests: true,
    includeSecurityTests: false,
    confidenceThreshold: 0.8,
    customPrompts: {}
  };

  @ViewChild('performanceChart', { static: false }) performanceChart!: ElementRef;

  constructor(
    private testRunnerService: TestRunnerService
  ) {}

  ngOnInit(): void {
    this.loadTestData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTestData(): void {
    this.testRunnerService.getTestSuites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(suites => {
        this.testSuites = suites;
      });

    this.testRunnerService.getCurrentRun()
      .pipe(takeUntil(this.destroy$))
      .subscribe(report => {
        this.currentReport = report;
      });

    this.testRunnerService.isRunning()
      .pipe(takeUntil(this.destroy$))
      .subscribe(running => {
        this.isRunning = running;
      });

    this.testRunnerService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.aiConfig = config;
      });
  }

  private setupSubscriptions(): void {
    // Additional subscriptions if needed
  }

  async runAllTests(): Promise<void> {
    try {
      await this.testRunnerService.runAllTests();
    } catch (error) {
      console.error('Failed to run all tests:', error);
    }
  }

  async runTestSuite(suiteId: string): Promise<void> {
    try {
      await this.testRunnerService.runTestSuite(suiteId);
    } catch (error) {
      console.error('Failed to run test suite:', error);
    }
  }

  async generateAITests(): Promise<void> {
    this.isGeneratingTests = true;
    
    try {
      // Mock component code for demonstration
      const mockComponentCode = `
        export class ProsodyAnalysisComponent {
          analyzeSyllables(text: string): Syllable[] { 
            return []; 
          }
          
          detectMeter(syllables: Syllable[]): MeterType { 
            return 'hexameter'; 
          }
        }
      `;

      const tests = await this.testRunnerService.generateTests(
        'prosody-analysis.component',
        mockComponentCode
      );

      if (tests.length > 0) {
        // Add tests to existing suite or create new one
        const suite = this.testSuites.find(s => s.id === 'prosody_analysis_suite');
        if (suite) {
          suite.tests.push(...tests);
        }
      }

      console.log(`Generated ${tests.length} AI tests`);
    } catch (error) {
      console.error('Failed to generate AI tests:', error);
    } finally {
      this.isGeneratingTests = false;
    }
  }

  async generateTestsForSuite(suite: TestSuite): Promise<void> {
    // Generate AI tests specifically for this suite
    await this.generateAITests();
  }

  viewTestDetails(suite: TestSuite): void {
    // Would open detailed test view
    console.log('Viewing details for suite:', suite.name);
  }

  exportTestReport(): void {
    if (!this.currentReport) return;

    const reportData = {
      ...this.currentReport,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-report-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  updateAIConfig(): void {
    this.testRunnerService.updateConfig(this.aiConfig);
  }

  // Helper methods
  getTotalTestCount(): number {
    return this.testSuites.reduce((count, suite) => count + suite.tests.length, 0);
  }

  getAITestCount(): number {
    return this.testSuites.reduce((count, suite) => 
      count + suite.tests.filter(test => test.createdBy === 'ai').length, 0
    );
  }

  getAITestsInSuite(suite: TestSuite): number {
    return suite.tests.filter(test => test.createdBy === 'ai').length;
  }

  getOverallSuccessRate(): number {
    if (!this.currentReport || this.currentReport.summary.total === 0) return 0;
    return Math.round((this.currentReport.summary.passed / this.currentReport.summary.total) * 100);
  }

  getOverallHealthColor(): string {
    const rate = this.getOverallSuccessRate();
    if (rate >= 90) return 'primary';
    if (rate >= 70) return 'accent';
    return 'warn';
  }

  getUniqueCategories(tests: TestCase[]): string[] {
    return [...new Set(tests.map(test => test.category))];
  }

  getTestsByCategory(tests: TestCase[], category: string): TestCase[] {
    return tests.filter(test => test.category === category);
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'unit': 'Egység',
      'integration': 'Integráció',
      'e2e': 'E2E',
      'performance': 'Teljesítmény',
      'accessibility': 'Akadálymentesség',
      'security': 'Biztonság'
    };
    return labels[category] || category;
  }

  getCoverageColor(percentage: number): string {
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'accent';
    return 'warn';
  }

  getTestName(testId: string): string {
    for (const suite of this.testSuites) {
      const test = suite.tests.find(t => t.id === testId);
      if (test) return test.name;
    }
    return testId;
  }

  trackBySuite(index: number, suite: TestSuite): string {
    return suite.id;
  }

  trackByResult(index: number, result: TestResult): string {
    return result.testId;
  }
}
