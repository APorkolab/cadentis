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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  EnterpriseService, 
  User, 
  UserRole, 
  Organization, 
  AuditLog,
  Integration,
  OrganizationSettings
} from '../../services/enterprise.service';
import { fadeInAnimation, scaleInAnimation, listAnimation } from '../../animations';

@Component({
  selector: 'app-admin-dashboard',
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
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="admin-dashboard" @fadeIn>
      <div class="dashboard-header">
        <h1>⚙️ Enterprise Admin</h1>
        <div class="header-controls">
          <mat-chip-set>
            <mat-chip color="primary" [selected]="true">
              <mat-icon matChipAvatar>business</mat-icon>
              {{ organization?.name }}
            </mat-chip>
            <mat-chip color="accent">
              <mat-icon matChipAvatar>people</mat-icon>
              {{ users.length }} felhasználó
            </mat-chip>
          </mat-chip-set>
          
          <button mat-raised-button color="primary" (click)="refreshData()" matTooltip="Adatok frissítése">
            <mat-icon>refresh</mat-icon>
            Frissítés
          </button>
        </div>
      </div>

      <mat-tab-group class="admin-tabs" animationDuration="300ms">
        <!-- Users Management Tab -->
        <mat-tab label="Felhasználók" [badgeHidden]="users.length === 0" [matBadge]="users.length">
          <div class="tab-content">
            <div class="section-header">
              <h3>
                <mat-icon>people</mat-icon>
                Felhasználók kezelése
              </h3>
              <button mat-raised-button color="primary" (click)="openUserDialog()">
                <mat-icon>person_add</mat-icon>
                Új felhasználó
              </button>
            </div>

            <div class="users-table-container">
              <mat-table [dataSource]="users" class="users-table">
                <ng-container matColumnDef="avatar">
                  <mat-header-cell *matHeaderCellDef></mat-header-cell>
                  <mat-cell *matCellDef="let user">
                    <div class="user-avatar">
                      <mat-icon>{{ user.avatar ? 'account_circle' : 'person' }}</mat-icon>
                    </div>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="name">
                  <mat-header-cell *matHeaderCellDef>Név</mat-header-cell>
                  <mat-cell *matCellDef="let user">
                    <div class="user-info">
                      <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                      <div class="user-username">@{{ user.username }}</div>
                    </div>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="email">
                  <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
                  <mat-cell *matCellDef="let user">{{ user.email }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="role">
                  <mat-header-cell *matHeaderCellDef>Szerepkör</mat-header-cell>
                  <mat-cell *matCellDef="let user">
                    <mat-chip [color]="getRoleColor(user.role)" selected>
                      {{ user.role.name }}
                    </mat-chip>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="department">
                  <mat-header-cell *matHeaderCellDef>Tanszék</mat-header-cell>
                  <mat-cell *matCellDef="let user">{{ user.department }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="status">
                  <mat-header-cell *matHeaderCellDef>Állapot</mat-header-cell>
                  <mat-cell *matCellDef="let user">
                    <mat-chip [color]="user.isActive ? 'primary' : 'warn'" [selected]="true">
                      <mat-icon matChipAvatar>{{ user.isActive ? 'check_circle' : 'block' }}</mat-icon>
                      {{ user.isActive ? 'Aktív' : 'Inaktív' }}
                    </mat-chip>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="lastLogin">
                  <mat-header-cell *matHeaderCellDef>Utolsó belépés</mat-header-cell>
                  <mat-cell *matCellDef="let user">{{ formatDate(user.lastLogin) }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <mat-header-cell *matHeaderCellDef>Műveletek</mat-header-cell>
                  <mat-cell *matCellDef="let user">
                    <button mat-icon-button matTooltip="Szerkesztés" (click)="editUser(user)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Jogosultságok" (click)="managePermissions(user)">
                      <mat-icon>security</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Törlés" color="warn" (click)="deleteUser(user)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="userColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: userColumns;"></mat-row>
              </mat-table>
            </div>
          </div>
        </mat-tab>

        <!-- Audit Logs Tab -->
        <mat-tab label="Audit logok" [badgeHidden]="auditLogs.length === 0" [matBadge]="auditLogs.length">
          <div class="tab-content">
            <div class="section-header">
              <h3>
                <mat-icon>history</mat-icon>
                Audit naplók
              </h3>
              
              <div class="audit-filters">
                <mat-form-field>
                  <mat-label>Felhasználó</mat-label>
                  <mat-select [(value)]="auditFilters.userId" (selectionChange)="filterAuditLogs()">
                    <mat-option value="">Összes</mat-option>
                    <mat-option *ngFor="let user of users" [value]="user.id">
                      {{ user.firstName }} {{ user.lastName }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>Súlyosság</mat-label>
                  <mat-select [(value)]="auditFilters.severity" (selectionChange)="filterAuditLogs()">
                    <mat-option value="">Összes</mat-option>
                    <mat-option value="low">Alacsony</mat-option>
                    <mat-option value="medium">Közepes</mat-option>
                    <mat-option value="high">Magas</mat-option>
                    <mat-option value="critical">Kritikus</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button (click)="exportAuditLogs()" matTooltip="Logok exportálása">
                  <mat-icon>download</mat-icon>
                  Export
                </button>
              </div>
            </div>

            <div class="audit-logs-container">
              <mat-expansion-panel 
                *ngFor="let log of filteredAuditLogs; trackBy: trackByLog" 
                class="audit-log-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-chip [color]="getSeverityColor(log.severity)" selected>
                      <mat-icon matChipAvatar>{{ getSeverityIcon(log.severity) }}</mat-icon>
                      {{ log.action }}
                    </mat-chip>
                  </mat-panel-title>
                  <mat-panel-description>
                    <span>{{ getUserName(log.userId) }}</span>
                    <span class="log-timestamp">{{ formatDateTime(log.timestamp) }}</span>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="audit-log-details">
                  <div class="log-metadata">
                    <div class="metadata-item">
                      <label>Erőforrás:</label>
                      <span>{{ log.resource }}</span>
                    </div>
                    <div class="metadata-item">
                      <label>IP cím:</label>
                      <span>{{ log.ipAddress }}</span>
                    </div>
                    <div class="metadata-item">
                      <label>Eredmény:</label>
                      <mat-chip [color]="getResultColor(log.result)" selected>
                        {{ log.result }}
                      </mat-chip>
                    </div>
                  </div>

                  <div class="log-details" *ngIf="log.details">
                    <h4>Részletek</h4>
                    <pre>{{ formatJSON(log.details) }}</pre>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>
          </div>
        </mat-tab>

        <!-- Organization Settings Tab -->
        <mat-tab label="Szervezet beállításai">
          <div class="tab-content" *ngIf="organization">
            <div class="settings-grid">
              <!-- Security Settings -->
              <mat-card class="settings-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>security</mat-icon>
                    Biztonsági beállítások
                  </mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="setting-item">
                    <mat-slide-toggle 
                      [(ngModel)]="organization.settings.security.twoFactorRequired"
                      (change)="updateSecuritySettings()">
                      Kötelező kétfaktoros hitelesítés
                    </mat-slide-toggle>
                  </div>

                  <mat-form-field>
                    <mat-label>Munkamenet időtúllépés (perc)</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [(ngModel)]="sessionTimeoutMinutes"
                      (ngModelChange)="updateSessionTimeout()"
                      min="5" max="1440">
                  </mat-form-field>

                  <div class="password-policy">
                    <h4>Jelszó szabályzat</h4>
                    
                    <mat-form-field>
                      <mat-label>Minimum hossz</mat-label>
                      <input 
                        matInput 
                        type="number" 
                        [(ngModel)]="organization.settings.security.passwordPolicy.minLength"
                        (ngModelChange)="updateSecuritySettings()"
                        min="4" max="32">
                    </mat-form-field>

                    <div class="policy-toggles">
                      <mat-slide-toggle 
                        [(ngModel)]="organization.settings.security.passwordPolicy.requireNumbers"
                        (change)="updateSecuritySettings()">
                        Számok kötelezőek
                      </mat-slide-toggle>

                      <mat-slide-toggle 
                        [(ngModel)]="organization.settings.security.passwordPolicy.requireUppercase"
                        (change)="updateSecuritySettings()">
                        Nagy betűk kötelezőek
                      </mat-slide-toggle>

                      <mat-slide-toggle 
                        [(ngModel)]="organization.settings.security.passwordPolicy.requireSymbols"
                        (change)="updateSecuritySettings()">
                        Szimbólumok kötelezőek
                      </mat-slide-toggle>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- SSO Settings -->
              <mat-card class="settings-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>login</mat-icon>
                    Single Sign-On
                  </mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="setting-item">
                    <mat-slide-toggle 
                      [(ngModel)]="organization.settings.singleSignOn.enabled"
                      (change)="updateSSOSettings()">
                      SSO engedélyezése
                    </mat-slide-toggle>
                  </div>

                  <mat-form-field *ngIf="organization.settings.singleSignOn.enabled">
                    <mat-label>SSO szolgáltató</mat-label>
                    <mat-select 
                      [(ngModel)]="organization.settings.singleSignOn.provider"
                      (selectionChange)="updateSSOSettings()">
                      <mat-option value="saml">SAML</mat-option>
                      <mat-option value="oauth2">OAuth2</mat-option>
                      <mat-option value="ldap">LDAP</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div class="sso-status" *ngIf="organization.settings.singleSignOn.enabled">
                    <mat-chip color="primary" selected>
                      <mat-icon matChipAvatar>{{ organization.settings.singleSignOn.provider === 'saml' ? 'verified_user' : 'login' }}</mat-icon>
                      {{ organization.settings.singleSignOn.provider.toUpperCase() }} konfigurálva
                    </mat-chip>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Data Retention -->
              <mat-card class="settings-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>storage</mat-icon>
                    Adatmegőrzés
                  </mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <mat-form-field>
                    <mat-label>Elemzési adatok (nap)</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [(ngModel)]="organization.settings.dataRetention.analysisDays"
                      (ngModelChange)="updateDataRetention()"
                      min="30" max="3650">
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Audit naplók (nap)</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [(ngModel)]="organization.settings.dataRetention.auditLogDays"
                      (ngModelChange)="updateDataRetention()"
                      min="90" max="2555">
                  </mat-form-field>
                </mat-card-content>
              </mat-card>

              <!-- Collaboration Settings -->
              <mat-card class="settings-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>group_work</mat-icon>
                    Kollaboráció
                  </mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <mat-form-field>
                    <mat-label>Max. együttműködők</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [(ngModel)]="organization.settings.collaboration.maxCollaborators"
                      (ngModelChange)="updateCollaborationSettings()"
                      min="1" max="100">
                  </mat-form-field>

                  <div class="setting-item">
                    <mat-slide-toggle 
                      [(ngModel)]="organization.settings.collaboration.allowExternalSharing"
                      (change)="updateCollaborationSettings()">
                      Külső megosztás engedélyezése
                    </mat-slide-toggle>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Integrations Tab -->
        <mat-tab label="Integrációk" [badgeHidden]="!organization?.integrations.length" [matBadge]="organization?.integrations.length">
          <div class="tab-content">
            <div class="section-header">
              <h3>
                <mat-icon>extension</mat-icon>
                Külső integrációk
              </h3>
              <button mat-raised-button color="primary" (click)="addIntegration()">
                <mat-icon>add</mat-icon>
                Integráció hozzáadása
              </button>
            </div>

            <div class="integrations-grid" *ngIf="organization">
              <mat-card 
                *ngFor="let integration of organization.integrations; trackBy: trackByIntegration" 
                class="integration-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>{{ getIntegrationIcon(integration.type) }}</mat-icon>
                    {{ integration.name }}
                  </mat-card-title>
                  <mat-card-subtitle>{{ integration.provider }}</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="integration-status">
                    <mat-chip [color]="getIntegrationStatusColor(integration.status)" selected>
                      <mat-icon matChipAvatar>{{ getIntegrationStatusIcon(integration.status) }}</mat-icon>
                      {{ getIntegrationStatusText(integration.status) }}
                    </mat-chip>
                  </div>

                  <div class="integration-info">
                    <div class="info-item">
                      <label>Típus:</label>
                      <span>{{ getIntegrationTypeText(integration.type) }}</span>
                    </div>
                    <div class="info-item">
                      <label>Utolsó szinkron:</label>
                      <span>{{ formatDateTime(integration.lastSync) }}</span>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button (click)="testIntegration(integration)" [disabled]="isTestingIntegration">
                    <mat-icon>play_arrow</mat-icon>
                    Teszt
                  </button>
                  <button mat-button (click)="configureIntegration(integration)">
                    <mat-icon>settings</mat-icon>
                    Beállítás
                  </button>
                  <button mat-button color="warn" (click)="removeIntegration(integration)">
                    <mat-icon>delete</mat-icon>
                    Eltávolítás
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

            <div class="no-integrations" *ngIf="!organization?.integrations.length">
              <mat-icon>extension_off</mat-icon>
              <h3>Nincsenek konfigurált integrációk</h3>
              <p>Adjon hozzá külső szolgáltatásokat a rendszer funkcionalitásának bővítéséhez.</p>
              <button mat-raised-button color="primary" (click)="addIntegration()">
                <mat-icon>add</mat-icon>
                Első integráció hozzáadása
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-dashboard {
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
      gap: 16px;
      align-items: center;
    }

    .admin-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tab-content {
      padding: 24px;
      min-height: 600px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #2c3e50;
    }

    /* Users Table */
    .users-table-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .users-table {
      width: 100%;
    }

    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e3f2fd;
      color: #1976d2;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .user-username {
      font-size: 0.8rem;
      color: #666;
    }

    /* Audit Logs */
    .audit-filters {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .audit-logs-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .audit-log-panel {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .log-timestamp {
      font-size: 0.8rem;
      color: #666;
      margin-left: auto;
    }

    .audit-log-details {
      padding: 16px 0;
    }

    .log-metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metadata-item label {
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
    }

    .log-details {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
    }

    .log-details h4 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .log-details pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 0.8rem;
      overflow-x: auto;
    }

    /* Settings Grid */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
    }

    .settings-card {
      height: fit-content;
    }

    .setting-item {
      margin: 16px 0;
    }

    .password-policy {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
      margin-top: 16px;
    }

    .password-policy h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
    }

    .policy-toggles {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sso-status {
      margin-top: 16px;
    }

    /* Integrations */
    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .integration-card {
      height: fit-content;
    }

    .integration-status {
      margin-bottom: 16px;
    }

    .integration-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .no-integrations {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: #999;
      text-align: center;
    }

    .no-integrations mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .admin-dashboard {
        padding: 16px;
      }
      
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
      }
      
      .section-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .audit-filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .settings-grid {
        grid-template-columns: 1fr;
      }
      
      .integrations-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: User[] = [];
  organization: Organization | null = null;
  auditLogs: AuditLog[] = [];
  filteredAuditLogs: AuditLog[] = [];
  
  userColumns = ['avatar', 'name', 'email', 'role', 'department', 'status', 'lastLogin', 'actions'];
  
  auditFilters = {
    userId: '',
    severity: '',
    resource: '',
    action: ''
  };

  sessionTimeoutMinutes = 60;
  isTestingIntegration = false;

  constructor(
    private enterpriseService: EnterpriseService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.enterpriseService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
      });

    this.enterpriseService.getOrganization()
      .pipe(takeUntil(this.destroy$))
      .subscribe(org => {
        this.organization = org;
        if (org) {
          this.sessionTimeoutMinutes = Math.floor(org.settings.security.sessionTimeout / 60000);
        }
      });

    this.enterpriseService.getAuditLogsStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.auditLogs = logs;
        this.filterAuditLogs();
      });
  }

  private setupSubscriptions(): void {
    // Additional subscriptions
  }

  refreshData(): void {
    this.loadData();
  }

  // User Management
  openUserDialog(user?: User): void {
    // Would open user dialog for create/edit
    console.log('Open user dialog:', user ? 'edit' : 'create');
  }

  editUser(user: User): void {
    this.openUserDialog(user);
  }

  async deleteUser(user: User): Promise<void> {
    if (confirm(`Biztosan törölni szeretné ${user.firstName} ${user.lastName} felhasználót?`)) {
      try {
        await this.enterpriseService.deleteUser(user.id);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  }

  managePermissions(user: User): void {
    // Would open permissions dialog
    console.log('Manage permissions for user:', user.username);
  }

  getRoleColor(role: UserRole): string {
    const colors: { [key: number]: string } = {
      1: 'primary',
      2: 'accent',
      3: 'warn',
      4: 'warn'
    };
    return colors[role.level] || 'primary';
  }

  // Audit Logs
  filterAuditLogs(): void {
    this.filteredAuditLogs = this.auditLogs.filter(log => {
      if (this.auditFilters.userId && log.userId !== this.auditFilters.userId) return false;
      if (this.auditFilters.severity && log.severity !== this.auditFilters.severity) return false;
      if (this.auditFilters.resource && log.resource !== this.auditFilters.resource) return false;
      if (this.auditFilters.action && !log.action.includes(this.auditFilters.action)) return false;
      return true;
    });
  }

  exportAuditLogs(): void {
    const csvData = this.convertAuditLogsToCSV(this.filteredAuditLogs);
    this.downloadFile(csvData, 'audit-logs.csv', 'text/csv');
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }

  getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      'low': 'primary',
      'medium': 'accent',
      'high': 'warn',
      'critical': 'warn'
    };
    return colors[severity] || 'primary';
  }

  getSeverityIcon(severity: string): string {
    const icons: { [key: string]: string } = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error',
      'critical': 'dangerous'
    };
    return icons[severity] || 'info';
  }

  getResultColor(result: string): string {
    const colors: { [key: string]: string } = {
      'success': 'primary',
      'warning': 'accent',
      'failure': 'warn'
    };
    return colors[result] || 'primary';
  }

  // Organization Settings
  updateSecuritySettings(): void {
    if (this.organization) {
      this.enterpriseService.updateOrganizationSettings({
        security: this.organization.settings.security
      });
    }
  }

  updateSessionTimeout(): void {
    if (this.organization) {
      this.organization.settings.security.sessionTimeout = this.sessionTimeoutMinutes * 60000;
      this.updateSecuritySettings();
    }
  }

  updateSSOSettings(): void {
    if (this.organization) {
      this.enterpriseService.updateOrganizationSettings({
        singleSignOn: this.organization.settings.singleSignOn
      });
    }
  }

  updateDataRetention(): void {
    if (this.organization) {
      this.enterpriseService.updateOrganizationSettings({
        dataRetention: this.organization.settings.dataRetention
      });
    }
  }

  updateCollaborationSettings(): void {
    if (this.organization) {
      this.enterpriseService.updateOrganizationSettings({
        collaboration: this.organization.settings.collaboration
      });
    }
  }

  // Integrations
  addIntegration(): void {
    // Would open integration dialog
    console.log('Add new integration');
  }

  async testIntegration(integration: Integration): Promise<void> {
    this.isTestingIntegration = true;
    
    try {
      const success = await this.enterpriseService.testIntegration(integration.id);
      const message = success ? 'Integráció teszt sikeres!' : 'Integráció teszt sikertelen!';
      alert(message);
    } catch (error) {
      alert('Hiba történt a teszt során!');
    } finally {
      this.isTestingIntegration = false;
    }
  }

  configureIntegration(integration: Integration): void {
    // Would open configuration dialog
    console.log('Configure integration:', integration.name);
  }

  async removeIntegration(integration: Integration): Promise<void> {
    if (confirm(`Biztosan eltávolítja a(z) ${integration.name} integrációt?`)) {
      try {
        await this.enterpriseService.removeIntegration(integration.id);
      } catch (error) {
        console.error('Failed to remove integration:', error);
      }
    }
  }

  getIntegrationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'lms': 'school',
      'storage': 'storage',
      'analytics': 'analytics',
      'auth': 'security',
      'notification': 'notifications'
    };
    return icons[type] || 'extension';
  }

  getIntegrationTypeText(type: string): string {
    const types: { [key: string]: string } = {
      'lms': 'Tanulásirányítási rendszer',
      'storage': 'Fájltároló',
      'analytics': 'Analitika',
      'auth': 'Hitelesítés',
      'notification': 'Értesítések'
    };
    return types[type] || type;
  }

  getIntegrationStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'active': 'primary',
      'inactive': 'accent',
      'error': 'warn'
    };
    return colors[status] || 'primary';
  }

  getIntegrationStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'active': 'check_circle',
      'inactive': 'pause_circle',
      'error': 'error'
    };
    return icons[status] || 'help';
  }

  getIntegrationStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'active': 'Aktív',
      'inactive': 'Inaktív',
      'error': 'Hiba'
    };
    return texts[status] || status;
  }

  // Utility methods
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  private convertAuditLogsToCSV(logs: AuditLog[]): string {
    const headers = ['Időpont', 'Felhasználó', 'Művelet', 'Erőforrás', 'Súlyosság', 'IP cím', 'Eredmény'];
    const rows = logs.map(log => [
      this.formatDateTime(log.timestamp),
      this.getUserName(log.userId),
      log.action,
      log.resource,
      log.severity,
      log.ipAddress,
      log.result
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  trackByLog(index: number, log: AuditLog): string {
    return log.id;
  }

  trackByIntegration(index: number, integration: Integration): string {
    return integration.id;
  }
}
