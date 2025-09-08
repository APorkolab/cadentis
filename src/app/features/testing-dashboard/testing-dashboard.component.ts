import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TestingService, TestSuite, TestResult, TestConfiguration } from '../../core/services/testing.service';

@Component({
  selector: 'app-testing-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="testing-dashboard">
      <h2>Testing Excellence Dashboard</h2>
      
      <!-- Overall Statistics -->
      <div class="stats-overview">
        <div class="stat-card">
          <h3>Test Suites</h3>
          <div class="stat-value">{{ overallStats.suiteCount }}</div>
        </div>
        <div class="stat-card">
          <h3>Total Tests</h3>
          <div class="stat-value">{{ overallStats.total }}</div>
        </div>
        <div class="stat-card success">
          <h3>Passed</h3>
          <div class="stat-value">{{ overallStats.passed }}</div>
        </div>
        <div class="stat-card danger">
          <h3>Failed</h3>
          <div class="stat-value">{{ overallStats.failed }}</div>
        </div>
        <div class="stat-card">
          <h3>Pass Rate</h3>
          <div class="stat-value">{{ overallStats.passRate.toFixed(1) }}%</div>
        </div>
        <div class="stat-card">
          <h3>Duration</h3>
          <div class="stat-value">{{ formatDuration(overallStats.duration) }}</div>
        </div>
      </div>

      <!-- Test Controls -->
      <div class="test-controls">
        <h3>Test Execution</h3>
        <div class="control-buttons">
          <button 
            (click)="runUnitTests()" 
            class="test-btn unit" 
            [disabled]="isRunning">
            Run Unit Tests
          </button>
          <button 
            (click)="runIntegrationTests()" 
            class="test-btn integration" 
            [disabled]="isRunning">
            Run Integration Tests
          </button>
          <button 
            (click)="runE2ETests()" 
            class="test-btn e2e" 
            [disabled]="isRunning">
            Run E2E Tests
          </button>
          <button 
            (click)="runPerformanceTests()" 
            class="test-btn performance" 
            [disabled]="isRunning">
            Run Performance Tests
          </button>
          <button 
            (click)="runAccessibilityTests()" 
            class="test-btn accessibility" 
            [disabled]="isRunning">
            Run Accessibility Tests
          </button>
          <button 
            (click)="runAllTests()" 
            class="test-btn all" 
            [disabled]="isRunning">
            🚀 Run All Tests
          </button>
        </div>
        
        <div class="status-indicator" *ngIf="isRunning">
          <div class="spinner"></div>
          <span>Running tests...</span>
        </div>
      </div>

      <!-- Test Suites Results -->
      <div class="test-suites" *ngIf="testSuites.length > 0">
        <h3>Test Results</h3>
        
        <div class="suite-grid">
          <div *ngFor="let suite of testSuites" class="suite-card" [class]="getSuiteClass(suite)">
            <div class="suite-header">
              <h4>{{ suite.name }}</h4>
              <span class="suite-type">{{ suite.type | titlecase }}</span>
            </div>
            
            <div class="suite-stats">
              <div class="stat-row">
                <span>Total: {{ suite.total }}</span>
                <span class="success">Passed: {{ suite.passed }}</span>
                <span class="danger">Failed: {{ suite.failed }}</span>
                <span class="warning">Skipped: {{ suite.skipped }}</span>
              </div>
              <div class="stat-row">
                <span>Duration: {{ formatDuration(suite.duration) }}</span>
                <span>Pass Rate: {{ getPassRate(suite).toFixed(1) }}%</span>
              </div>
            </div>

            <!-- Coverage Information -->
            <div class="coverage-info" *ngIf="suite.coverage">
              <h5>Code Coverage</h5>
              <div class="coverage-bars">
                <div class="coverage-bar">
                  <label>Statements</label>
                  <div class="bar">
                    <div class="fill" [style.width.%]="suite.coverage.statements"
                         [class]="getCoverageClass(suite.coverage.statements)"></div>
                    <span class="percentage">{{ suite.coverage.statements }}%</span>
                  </div>
                </div>
                <div class="coverage-bar">
                  <label>Branches</label>
                  <div class="bar">
                    <div class="fill" [style.width.%]="suite.coverage.branches"
                         [class]="getCoverageClass(suite.coverage.branches)"></div>
                    <span class="percentage">{{ suite.coverage.branches }}%</span>
                  </div>
                </div>
                <div class="coverage-bar">
                  <label>Functions</label>
                  <div class="bar">
                    <div class="fill" [style.width.%]="suite.coverage.functions"
                         [class]="getCoverageClass(suite.coverage.functions)"></div>
                    <span class="percentage">{{ suite.coverage.functions }}%</span>
                  </div>
                </div>
                <div class="coverage-bar">
                  <label>Lines</label>
                  <div class="bar">
                    <div class="fill" [style.width.%]="suite.coverage.lines"
                         [class]="getCoverageClass(suite.coverage.lines)"></div>
                    <span class="percentage">{{ suite.coverage.lines }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Individual Test Results -->
            <div class="test-results">
              <h5>Test Details</h5>
              <div class="test-list">
                <div *ngFor="let test of suite.tests" 
                     class="test-item" 
                     [class]="test.status">
                  <div class="test-header">
                    <span class="test-status">{{ getStatusIcon(test.status) }}</span>
                    <span class="test-name">{{ test.name }}</span>
                    <span class="test-duration">{{ formatDuration(test.duration) }}</span>
                  </div>
                  <div class="test-error" *ngIf="test.errorMessage">
                    {{ test.errorMessage }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Test Configuration -->
      <div class="test-config">
        <h3>Test Configuration</h3>
        <div class="config-grid">
          <div class="config-item">
            <label>Coverage Enabled</label>
            <span class="status" [class.enabled]="config.enableCoverage">
              {{ config.enableCoverage ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="config-item">
            <label>Performance Testing</label>
            <span class="status" [class.enabled]="config.enablePerformanceTesting">
              {{ config.enablePerformanceTesting ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="config-item">
            <label>Accessibility Testing</label>
            <span class="status" [class.enabled]="config.enableAccessibilityTesting">
              {{ config.enableAccessibilityTesting ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="config-item">
            <label>Parallel Execution</label>
            <span class="status" [class.enabled]="config.parallelExecution">
              {{ config.parallelExecution ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="config-item">
            <label>Retry Failed Tests</label>
            <span class="value">{{ config.retryFailedTests }} times</span>
          </div>
          <div class="config-item">
            <label>Timeout</label>
            <span class="value">{{ config.timeout / 1000 }}s</span>
          </div>
        </div>

        <!-- Coverage Thresholds -->
        <div class="coverage-thresholds">
          <h4>Coverage Thresholds</h4>
          <div class="threshold-grid">
            <div class="threshold-item">
              <label>Statements</label>
              <span>{{ config.coverageThreshold.statements }}%</span>
            </div>
            <div class="threshold-item">
              <label>Branches</label>
              <span>{{ config.coverageThreshold.branches }}%</span>
            </div>
            <div class="threshold-item">
              <label>Functions</label>
              <span>{{ config.coverageThreshold.functions }}%</span>
            </div>
            <div class="threshold-item">
              <label>Lines</label>
              <span>{{ config.coverageThreshold.lines }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="test-actions">
        <button (click)="generateReport()" class="action-btn report">
          Generate Test Report
        </button>
        <button (click)="clearResults()" class="action-btn clear">
          Clear Results
        </button>
        <button (click)="exportResults()" class="action-btn export">
          Export Results
        </button>
      </div>

      <!-- Test Report Modal -->
      <div class="modal" *ngIf="showReport" (click)="closeReport()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Test Execution Report</h3>
            <button class="close-btn" (click)="closeReport()">×</button>
          </div>
          <div class="modal-body">
            <pre>{{ testReport }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .testing-dashboard {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    h2 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-card.success {
      border-left: 4px solid #27ae60;
    }

    .stat-card.danger {
      border-left: 4px solid #e74c3c;
    }

    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #7f8c8d;
      font-size: 14px;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }

    .test-controls {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .control-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .test-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
    }

    .test-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .test-btn.unit { background: #3498db; color: white; }
    .test-btn.integration { background: #9b59b6; color: white; }
    .test-btn.e2e { background: #e67e22; color: white; }
    .test-btn.performance { background: #f39c12; color: white; }
    .test-btn.accessibility { background: #1abc9c; color: white; }
    .test-btn.all { background: #27ae60; color: white; font-size: 16px; }

    .test-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #3498db;
      font-weight: bold;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #ecf0f1;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .suite-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
      gap: 20px;
    }

    .suite-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .suite-card.success {
      border-left: 4px solid #27ae60;
    }

    .suite-card.warning {
      border-left: 4px solid #f39c12;
    }

    .suite-card.danger {
      border-left: 4px solid #e74c3c;
    }

    .suite-header {
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .suite-header h4 {
      margin: 0;
      color: #2c3e50;
    }

    .suite-type {
      background: #6c757d;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .suite-stats {
      padding: 15px 20px;
    }

    .stat-row {
      display: flex;
      gap: 20px;
      margin-bottom: 10px;
      font-size: 14px;
    }

    .stat-row:last-child {
      margin-bottom: 0;
    }

    .success { color: #27ae60; }
    .danger { color: #e74c3c; }
    .warning { color: #f39c12; }

    .coverage-info {
      padding: 15px 20px;
      border-top: 1px solid #dee2e6;
      background: #f8f9fa;
    }

    .coverage-info h5 {
      margin: 0 0 15px 0;
      color: #2c3e50;
    }

    .coverage-bars {
      display: grid;
      gap: 10px;
    }

    .coverage-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .coverage-bar label {
      min-width: 80px;
      font-size: 12px;
      color: #6c757d;
    }

    .bar {
      flex: 1;
      height: 20px;
      background: #ecf0f1;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
    }

    .fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .fill.high { background: #27ae60; }
    .fill.medium { background: #f39c12; }
    .fill.low { background: #e74c3c; }

    .percentage {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
    }

    .test-results {
      padding: 15px 20px;
      border-top: 1px solid #dee2e6;
    }

    .test-results h5 {
      margin: 0 0 15px 0;
      color: #2c3e50;
    }

    .test-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .test-item {
      padding: 10px 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .test-item:last-child {
      border-bottom: none;
    }

    .test-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .test-status {
      font-size: 16px;
      min-width: 20px;
    }

    .test-name {
      flex: 1;
      font-size: 14px;
      color: #2c3e50;
    }

    .test-duration {
      font-size: 12px;
      color: #6c757d;
    }

    .test-error {
      margin-top: 5px;
      padding: 8px;
      background: #fdf2f2;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      font-size: 12px;
      color: #721c24;
    }

    .test-config {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .config-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      background: #dc3545;
      color: white;
    }

    .status.enabled {
      background: #28a745;
    }

    .value {
      font-weight: bold;
      color: #2c3e50;
    }

    .coverage-thresholds {
      border-top: 1px solid #dee2e6;
      padding-top: 20px;
    }

    .threshold-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }

    .threshold-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .test-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 30px;
    }

    .action-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
    }

    .action-btn.report { background: #17a2b8; color: white; }
    .action-btn.clear { background: #dc3545; color: white; }
    .action-btn.export { background: #28a745; color: white; }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow: hidden;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
    }

    .modal-body {
      padding: 20px;
      overflow: auto;
      max-height: 60vh;
    }

    .modal-body pre {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
    }
  `]
})
export class TestingDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  testSuites: TestSuite[] = [];
  testResults: TestResult[] = [];
  isRunning = false;
  overallStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    passRate: 0,
    suiteCount: 0
  };
  
  config: TestConfiguration = {
    enableCoverage: true,
    coverageThreshold: { statements: 80, branches: 75, functions: 80, lines: 80 },
    enablePerformanceTesting: true,
    enableAccessibilityTesting: true,
    enableVisualRegression: false,
    parallelExecution: true,
    retryFailedTests: 2,
    timeout: 30000
  };
  
  showReport = false;
  testReport = '';

  constructor(private testingService: TestingService) {}

  ngOnInit() {
    this.testingService.testSuites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(suites => {
        this.testSuites = suites;
        this.updateOverallStats();
      });

    this.testingService.testResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.testResults = results;
      });

    this.testingService.isRunning$
      .pipe(takeUntil(this.destroy$))
      .subscribe(running => {
        this.isRunning = running;
      });

    this.config = this.testingService.getConfig();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Test execution methods
  async runUnitTests() {
    await this.testingService.runUnitTests();
  }

  async runIntegrationTests() {
    await this.testingService.runIntegrationTests();
  }

  async runE2ETests() {
    await this.testingService.runE2ETests();
  }

  async runPerformanceTests() {
    await this.testingService.runPerformanceTests();
  }

  async runAccessibilityTests() {
    await this.testingService.runAccessibilityTests();
  }

  async runAllTests() {
    await this.testingService.runAllTests();
  }

  // Utility methods
  formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration.toFixed(0)}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      case 'running': return '🔄';
      default: return '⚪';
    }
  }

  getSuiteClass(suite: TestSuite): string {
    if (suite.failed > 0) return 'danger';
    if (suite.skipped > 0) return 'warning';
    return 'success';
  }

  getPassRate(suite: TestSuite): number {
    return suite.total > 0 ? (suite.passed / suite.total) * 100 : 0;
  }

  getCoverageClass(coverage: number): string {
    if (coverage >= 80) return 'high';
    if (coverage >= 60) return 'medium';
    return 'low';
  }

  private updateOverallStats() {
    this.overallStats = this.testingService.getOverallStats();
  }

  // Actions
  generateReport() {
    this.testReport = this.testingService.generateTestReport();
    this.showReport = true;
  }

  closeReport() {
    this.showReport = false;
  }

  clearResults() {
    this.testingService.clearResults();
  }

  exportResults() {
    const report = this.testingService.generateTestReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
