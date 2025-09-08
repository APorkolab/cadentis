import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecurityService, SecurityMetrics, SecurityThreat, SecurityConfig } from '../../core/services/security.service';
import { EncryptionService } from '../../core/services/encryption.service';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="security-dashboard">
      <h2>Security Dashboard</h2>
      
      <!-- Security Score -->
      <div class="security-score-card" [class.high-score]="metrics.securityScore >= 90" 
           [class.medium-score]="metrics.securityScore >= 70 && metrics.securityScore < 90"
           [class.low-score]="metrics.securityScore < 70">
        <h3>Security Score</h3>
        <div class="score">{{ metrics.securityScore }}/100</div>
        <div class="score-bar">
          <div class="score-fill" [style.width.%]="metrics.securityScore"></div>
        </div>
      </div>

      <!-- Security Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <h4>Total Threats</h4>
          <div class="metric-value">{{ metrics.totalThreats }}</div>
        </div>
        <div class="metric-card">
          <h4>Blocked Threats</h4>
          <div class="metric-value success">{{ metrics.blockedThreats }}</div>
        </div>
        <div class="metric-card">
          <h4>Last Threat</h4>
          <div class="metric-value">
            {{ metrics.lastThreatTime ? (metrics.lastThreatTime | date:'short') : 'None' }}
          </div>
        </div>
      </div>

      <!-- Threat Breakdown -->
      <div class="threat-breakdown">
        <h3>Threat Types</h3>
        <div class="threat-types">
          <div *ngFor="let type of getThreatTypes()" class="threat-type">
            <span class="threat-name">{{ type.name | titlecase }}</span>
            <span class="threat-count">{{ type.count }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Threats -->
      <div class="recent-threats">
        <h3>Recent Security Events</h3>
        <div class="threats-list">
          <div *ngFor="let threat of recentThreats" 
               class="threat-item"
               [class]="'severity-' + threat.severity">
            <div class="threat-header">
              <span class="threat-type">{{ threat.type | titlecase }}</span>
              <span class="threat-severity">{{ threat.severity | titlecase }}</span>
              <span class="threat-time">{{ threat.timestamp | date:'short' }}</span>
            </div>
            <div class="threat-description">{{ threat.description }}</div>
            <div class="threat-source" *ngIf="threat.source">Source: {{ threat.source }}</div>
          </div>
        </div>
      </div>

      <!-- Security Configuration -->
      <div class="security-config">
        <h3>Security Configuration</h3>
        <div class="config-grid">
          <div class="config-item">
            <label>XSS Protection</label>
            <span class="status" [class.enabled]="config.xss.enabled">
              {{ config.xss.enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <div class="config-item">
            <label>CSRF Protection</label>
            <span class="status" [class.enabled]="config.csrf.enabled">
              {{ config.csrf.enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <div class="config-item">
            <label>Rate Limiting</label>
            <span class="status" [class.enabled]="config.rateLimit.enabled">
              {{ config.rateLimit.enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <div class="config-item">
            <label>CSP</label>
            <span class="status" [class.enabled]="config.csp.enabled">
              {{ config.csp.enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Security Testing -->
      <div class="security-testing">
        <h3>Security Testing</h3>
        <div class="test-buttons">
          <button (click)="testXSSProtection()" class="test-btn">Test XSS Protection</button>
          <button (click)="testRateLimit()" class="test-btn">Test Rate Limit</button>
          <button (click)="testSuspiciousActivity()" class="test-btn">Test Suspicious Activity</button>
          <button (click)="testEncryption()" class="test-btn">Test Encryption</button>
        </div>
      </div>

      <!-- Encryption Demo -->
      <div class="encryption-demo" *ngIf="encryptionResult">
        <h4>Encryption Test Result</h4>
        <div class="encryption-result">
          <div><strong>Original:</strong> {{ originalText }}</div>
          <div><strong>Encrypted:</strong> {{ encryptionResult.encrypted.substring(0, 50) }}...</div>
          <div><strong>Decrypted:</strong> {{ decryptedText }}</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="security-actions">
        <button (click)="performSecurityAudit()" class="action-btn audit">Run Security Audit</button>
        <button (click)="clearThreats()" class="action-btn clear">Clear Threat Log</button>
        <button (click)="generateCSRFToken()" class="action-btn token">Generate New CSRF Token</button>
      </div>
    </div>
  `,
  styles: [`
    .security-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 30px;
      text-align: center;
    }

    .security-score-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      border-left: 4px solid #e74c3c;
    }

    .security-score-card.high-score {
      border-left-color: #27ae60;
    }

    .security-score-card.medium-score {
      border-left-color: #f39c12;
    }

    .score {
      font-size: 48px;
      font-weight: bold;
      color: #2c3e50;
      margin: 10px 0;
    }

    .score-bar {
      width: 100%;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(to right, #e74c3c, #f39c12, #27ae60);
      transition: width 0.3s ease;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .metric-card h4 {
      margin: 0 0 10px 0;
      color: #7f8c8d;
      font-size: 14px;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }

    .metric-value.success {
      color: #27ae60;
    }

    .threat-breakdown, .recent-threats, .security-config, .security-testing {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .threat-types {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }

    .threat-type {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .threats-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .threat-item {
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 10px;
      background: #f8f9fa;
    }

    .threat-item.severity-critical {
      border-left: 4px solid #e74c3c;
      background: #fdf2f2;
    }

    .threat-item.severity-high {
      border-left: 4px solid #fd7e14;
      background: #fff8f0;
    }

    .threat-item.severity-medium {
      border-left: 4px solid #ffc107;
      background: #fffbf0;
    }

    .threat-item.severity-low {
      border-left: 4px solid #20c997;
      background: #f0fff4;
    }

    .threat-header {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 5px;
    }

    .threat-type {
      font-weight: bold;
      color: #495057;
    }

    .threat-severity {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      text-transform: uppercase;
      background: #6c757d;
      color: white;
    }

    .threat-time {
      font-size: 12px;
      color: #6c757d;
      margin-left: auto;
    }

    .threat-description {
      color: #495057;
      margin-bottom: 5px;
    }

    .threat-source {
      font-size: 12px;
      color: #6c757d;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
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

    .test-buttons, .security-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .test-btn, .action-btn {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .test-btn {
      background: #007bff;
      color: white;
    }

    .test-btn:hover {
      background: #0056b3;
    }

    .action-btn.audit {
      background: #17a2b8;
      color: white;
    }

    .action-btn.clear {
      background: #dc3545;
      color: white;
    }

    .action-btn.token {
      background: #28a745;
      color: white;
    }

    .action-btn:hover {
      opacity: 0.8;
    }

    .encryption-demo {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }

    .encryption-result div {
      margin-bottom: 5px;
      font-family: monospace;
      font-size: 12px;
    }
  `]
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  metrics: SecurityMetrics = {
    totalThreats: 0,
    blockedThreats: 0,
    threatsByType: {},
    threatsBySeverity: {},
    securityScore: 100
  };
  
  recentThreats: SecurityThreat[] = [];
  config: SecurityConfig = {
    csp: { enabled: true },
    xss: { enabled: true, allowedTags: [], allowedAttributes: [] },
    csrf: { enabled: true, tokenHeaderName: 'X-CSRF-Token' },
    rateLimit: { enabled: true, maxRequests: 100, windowMs: 900000 },
    contentSecurityPolicy: ''
  };
  
  // Encryption demo
  originalText = '';
  encryptionResult: any = null;
  decryptedText = '';

  constructor(
    private securityService: SecurityService,
    private encryptionService: EncryptionService
  ) {}

  ngOnInit() {
    // Subscribe to security metrics
    this.securityService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.metrics = metrics;
      });

    // Subscribe to threats
    this.securityService.threats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threats => {
        this.recentThreats = threats.slice(-10).reverse(); // Show latest 10
      });

    // Get current config
    this.config = this.securityService.getConfig();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getThreatTypes() {
    return Object.entries(this.metrics.threatsByType).map(([name, count]) => ({
      name,
      count
    }));
  }

  // Security testing methods
  testXSSProtection() {
    const maliciousInput = '<script>alert("XSS Test")</script><img src="x" onerror="alert(\'XSS\')">';
    const sanitized = this.securityService.sanitizeHtml(maliciousInput);
    console.log('XSS Test:', { original: maliciousInput, sanitized });
    
    // Test XSS detection
    this.securityService.detectXSSAttempt(maliciousInput);
  }

  testRateLimit() {
    // Simulate multiple rapid requests
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.securityService.checkRateLimit('test-endpoint');
      }, i * 100);
    }
  }

  testSuspiciousActivity() {
    const suspiciousActivities = [
      '/admin/users',
      '/api/admin/delete',
      '../../../etc/passwd',
      '/root/secrets'
    ];

    suspiciousActivities.forEach(activity => {
      this.securityService.detectSuspiciousActivity(activity);
    });
  }

  async testEncryption() {
    this.originalText = 'This is sensitive data that needs encryption!';
    const password = 'test-password-123';

    try {
      this.encryptionResult = await this.encryptionService.encryptWithPassword(
        this.originalText,
        password
      );
      
      this.decryptedText = await this.encryptionService.decryptWithPassword(
        this.encryptionResult,
        password
      );
      
      console.log('Encryption Test:', {
        original: this.originalText,
        encrypted: this.encryptionResult,
        decrypted: this.decryptedText
      });
    } catch (error) {
      console.error('Encryption test failed:', error);
    }
  }

  performSecurityAudit() {
    const auditResults = this.securityService.performSecurityAudit();
    console.log('Security Audit Results:', auditResults);
  }

  clearThreats() {
    this.securityService.clearThreats();
  }

  generateCSRFToken() {
    const token = this.securityService.generateCSRFToken();
    console.log('New CSRF Token generated:', token);
  }
}
