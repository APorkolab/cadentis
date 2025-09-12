import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  permissions: Permission[];
  settings: UserSettings;
  avatar?: string;
  metadata?: { [key: string]: any };
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1=basic, 2=advanced, 3=admin, 4=superadmin
  permissions: Permission[];
  inheritsFrom?: string[]; // inherited roles
}

export interface Permission {
  id: string;
  resource: string; // e.g., 'analysis', 'collaboration', 'admin'
  action: string; // e.g., 'read', 'write', 'delete', 'execute'
  scope: 'own' | 'department' | 'organization' | 'all';
  conditions?: { [key: string]: any };
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'hu' | 'en' | 'la';
  notifications: {
    email: boolean;
    push: boolean;
    analysis: boolean;
    collaboration: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    shareContent: boolean;
    allowTracking: boolean;
  };
  workspacePreferences: {
    defaultView: string;
    autoSave: boolean;
    shortcuts: { [key: string]: string };
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'warning';
  details: { [key: string]: any };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  type: 'educational' | 'research' | 'commercial' | 'government';
  settings: OrganizationSettings;
  subscription: {
    plan: 'basic' | 'professional' | 'enterprise';
    features: string[];
    limits: { [key: string]: number };
    expiresAt: Date;
  };
  integrations: Integration[];
}

export interface OrganizationSettings {
  singleSignOn: {
    enabled: boolean;
    provider: 'saml' | 'oauth2' | 'ldap';
    configuration: { [key: string]: any };
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
      requireUppercase: boolean;
      expirationDays: number;
    };
    sessionTimeout: number;
    ipRestrictions: string[];
    twoFactorRequired: boolean;
  };
  dataRetention: {
    analysisDays: number;
    auditLogDays: number;
    exportFormats: string[];
  };
  collaboration: {
    maxCollaborators: number;
    allowExternalSharing: boolean;
    defaultPermissions: Permission[];
  };
}

export interface Integration {
  id: string;
  name: string;
  type: 'lms' | 'storage' | 'analytics' | 'auth' | 'notification';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  configuration: { [key: string]: any };
  lastSync: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private organization$ = new BehaviorSubject<Organization | null>(null);
  private users$ = new BehaviorSubject<User[]>([]);
  private auditLogs$ = new BehaviorSubject<AuditLog[]>([]);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);

  private defaultRoles: UserRole[] = [
    {
      id: 'student',
      name: 'Diák',
      description: 'Alapvető elemzési jogosultságok',
      level: 1,
      permissions: [
        { id: 'analysis_read', resource: 'analysis', action: 'read', scope: 'own' },
        { id: 'analysis_create', resource: 'analysis', action: 'write', scope: 'own' }
      ]
    },
    {
      id: 'teacher',
      name: 'Tanár',
      description: 'Oktatási jogosultságok és felügyelet',
      level: 2,
      permissions: [
        { id: 'analysis_read', resource: 'analysis', action: 'read', scope: 'department' },
        { id: 'analysis_create', resource: 'analysis', action: 'write', scope: 'department' },
        { id: 'collaboration_manage', resource: 'collaboration', action: 'execute', scope: 'department' },
        { id: 'users_view', resource: 'users', action: 'read', scope: 'department' }
      ]
    },
    {
      id: 'admin',
      name: 'Adminisztrátor',
      description: 'Teljes szervezeti kezelés',
      level: 3,
      permissions: [
        { id: 'all_read', resource: '*', action: 'read', scope: 'organization' },
        { id: 'all_write', resource: '*', action: 'write', scope: 'organization' },
        { id: 'users_manage', resource: 'users', action: '*', scope: 'organization' },
        { id: 'audit_view', resource: 'audit', action: 'read', scope: 'organization' }
      ]
    },
    {
      id: 'superadmin',
      name: 'Főadminisztrátor',
      description: 'Rendszerszintű jogosultságok',
      level: 4,
      permissions: [
        { id: 'system_all', resource: '*', action: '*', scope: 'all' }
      ]
    }
  ];

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    // Load user session if exists
    this.loadUserSession();
    
    // Setup audit logging
    this.setupAuditLogging();
    
    // Initialize default organization if needed
    this.initializeOrganization();
  }

  // Authentication methods
  async login(credentials: { username: string; password: string; organizationDomain?: string }): Promise<User> {
    this.logAuditEvent('login_attempt', 'auth', null, { username: credentials.username });

    try {
      // Simulate authentication
      const user = await this.authenticateUser(credentials);
      
      if (!user) {
        throw new Error('Érvénytelen belépési adatok');
      }

      if (!user.isActive) {
        throw new Error('A felhasználói fiók inaktív');
      }

      // Update last login
      user.lastLogin = new Date();
      this.currentUser$.next(user);
      this.isAuthenticated$.next(true);

      // Store session
      this.storeUserSession(user);

      this.logAuditEvent('login_success', 'auth', user.id, { username: user.username });

      return user;

    } catch (error) {
      this.logAuditEvent('login_failure', 'auth', null, { 
        username: credentials.username, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async loginWithSSO(provider: string, token: string): Promise<User> {
    this.logAuditEvent('sso_login_attempt', 'auth', null, { provider });

    try {
      const user = await this.authenticateSSO(provider, token);
      
      if (!user) {
        throw new Error('SSO hitelesítés sikertelen');
      }

      this.currentUser$.next(user);
      this.isAuthenticated$.next(true);
      this.storeUserSession(user);

      this.logAuditEvent('sso_login_success', 'auth', user.id, { provider, username: user.username });

      return user;

    } catch (error) {
      this.logAuditEvent('sso_login_failure', 'auth', null, { 
        provider, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    const currentUser = this.currentUser$.value;
    
    if (currentUser) {
      this.logAuditEvent('logout', 'auth', currentUser.id, { username: currentUser.username });
    }

    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
    this.clearUserSession();
  }

  // User management
  async createUser(userData: Partial<User>): Promise<User> {
    this.checkPermission('users', 'write', 'organization');

    const user: User = {
      id: this.generateId(),
      username: userData.username!,
      email: userData.email!,
      firstName: userData.firstName!,
      lastName: userData.lastName!,
      role: userData.role || this.defaultRoles[0],
      department: userData.department || '',
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
      permissions: userData.role?.permissions || [],
      settings: this.getDefaultUserSettings(),
      ...userData
    };

    // Add to users list
    const currentUsers = this.users$.value;
    this.users$.next([...currentUsers, user]);

    this.logAuditEvent('user_created', 'users', user.id, { username: user.username });

    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    this.checkPermission('users', 'write', 'organization');

    const users = this.users$.value;
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('Felhasználó nem található');
    }

    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    this.users$.next([...users]);

    this.logAuditEvent('user_updated', 'users', userId, { changes: Object.keys(updates) });

    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    this.checkPermission('users', 'delete', 'organization');

    const users = this.users$.value;
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('Felhasználó nem található');
    }

    const user = users[userIndex];
    users.splice(userIndex, 1);
    this.users$.next([...users]);

    this.logAuditEvent('user_deleted', 'users', userId, { username: user.username });
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    this.checkPermission('users', 'write', 'organization');

    const role = this.defaultRoles.find(r => r.id === roleId);
    if (!role) {
      throw new Error('Szerepkör nem található');
    }

    await this.updateUser(userId, { role, permissions: role.permissions });

    this.logAuditEvent('role_assigned', 'users', userId, { roleId, roleName: role.name });
  }

  // Permission system
  hasPermission(resource: string, action: string, scope: string = 'own'): boolean {
    const currentUser = this.currentUser$.value;
    if (!currentUser) return false;

    // Superadmin has all permissions
    if (currentUser.role.level >= 4) return true;

    // Check explicit permissions
    return currentUser.permissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.action === '*' || permission.action === action;
      const scopeMatch = this.checkScope(permission.scope, scope);

      return resourceMatch && actionMatch && scopeMatch;
    });
  }

  private checkPermission(resource: string, action: string, scope: string = 'own'): void {
    if (!this.hasPermission(resource, action, scope)) {
      const currentUser = this.currentUser$.value;
      this.logAuditEvent('permission_denied', 'auth', currentUser?.id, { resource, action, scope });
      throw new Error('Nincs jogosultsága ehhez a művelethez');
    }
  }

  private checkScope(userScope: string, requiredScope: string): boolean {
    const scopeLevels = ['own', 'department', 'organization', 'all'];
    const userLevel = scopeLevels.indexOf(userScope);
    const requiredLevel = scopeLevels.indexOf(requiredScope);
    
    return userLevel >= requiredLevel;
  }

  // Audit logging
  private logAuditEvent(
    action: string, 
    resource: string, 
    resourceId: string | null, 
    details: any = {}
  ): void {
    const auditLog: AuditLog = {
      id: this.generateId(),
      userId: this.currentUser$.value?.id || 'anonymous',
      action,
      resource,
      resourceId: resourceId || undefined,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      result: 'success',
      details,
      severity: this.calculateSeverity(action, resource)
    };

    const currentLogs = this.auditLogs$.value;
    this.auditLogs$.next([auditLog, ...currentLogs].slice(0, 1000)); // Keep last 1000 logs
  }

  private calculateSeverity(action: string, resource: string): 'low' | 'medium' | 'high' | 'critical' {
    if (action.includes('delete') || action.includes('failure')) return 'high';
    if (action.includes('login') || action.includes('permission')) return 'medium';
    if (resource === 'auth' || resource === 'users') return 'medium';
    return 'low';
  }

  async getAuditLogs(filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
  }): Promise<AuditLog[]> {
    this.checkPermission('audit', 'read', 'organization');

    let logs = this.auditLogs$.value;

    if (filters) {
      logs = logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.resource && log.resource !== filters.resource) return false;
        if (filters.action && !log.action.includes(filters.action)) return false;
        if (filters.severity && log.severity !== filters.severity) return false;
        if (filters.startDate && log.timestamp < filters.startDate) return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        return true;
      });
    }

    return logs;
  }

  // Organization management
  async updateOrganizationSettings(settings: Partial<OrganizationSettings>): Promise<void> {
    this.checkPermission('organization', 'write', 'organization');

    const currentOrg = this.organization$.value;
    if (!currentOrg) throw new Error('Szervezet nem található');

    currentOrg.settings = { ...currentOrg.settings, ...settings };
    this.organization$.next(currentOrg);

    this.logAuditEvent('organization_settings_updated', 'organization', currentOrg.id, { changes: Object.keys(settings) });
  }

  // Integration management
  async addIntegration(integration: Omit<Integration, 'id' | 'lastSync'>): Promise<Integration> {
    this.checkPermission('integrations', 'write', 'organization');

    const newIntegration: Integration = {
      ...integration,
      id: this.generateId(),
      lastSync: new Date()
    };

    const currentOrg = this.organization$.value;
    if (currentOrg) {
      currentOrg.integrations.push(newIntegration);
      this.organization$.next(currentOrg);
    }

    this.logAuditEvent('integration_added', 'integrations', newIntegration.id, { 
      name: integration.name, 
      type: integration.type 
    });

    return newIntegration;
  }

  async removeIntegration(integrationId: string): Promise<void> {
    this.checkPermission('integrations', 'delete', 'organization');

    const currentOrg = this.organization$.value;
    if (!currentOrg) return;

    const index = currentOrg.integrations.findIndex(i => i.id === integrationId);
    if (index !== -1) {
      const integration = currentOrg.integrations[index];
      currentOrg.integrations.splice(index, 1);
      this.organization$.next(currentOrg);

      this.logAuditEvent('integration_removed', 'integrations', integrationId, { 
        name: integration.name,
        type: integration.type 
      });
    }
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    this.checkPermission('integrations', 'execute', 'organization');

    const currentOrg = this.organization$.value;
    const integration = currentOrg?.integrations.find(i => i.id === integrationId);

    if (!integration) {
      throw new Error('Integráció nem található');
    }

    try {
      // Simulate integration test
      await this.delay(1000);
      const success = Math.random() > 0.1; // 90% success rate

      integration.status = success ? 'active' : 'error';
      integration.lastSync = new Date();

      this.logAuditEvent('integration_tested', 'integrations', integrationId, { 
        success,
        name: integration.name 
      });

      return success;

    } catch (error) {
      integration.status = 'error';
      this.logAuditEvent('integration_test_failed', 'integrations', integrationId, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        name: integration.name 
      });
      return false;
    }
  }

  // Data export and compliance
  async exportUserData(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> {
    this.checkPermission('users', 'read', 'organization');

    const user = this.users$.value.find(u => u.id === userId);
    if (!user) {
      throw new Error('Felhasználó nem található');
    }

    const userData = {
      user,
      auditLogs: this.auditLogs$.value.filter(log => log.userId === userId),
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser$.value?.username
    };

    let exportData: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(userData, null, 2);
        break;
      case 'csv':
        exportData = this.convertToCSV(userData);
        break;
      case 'xml':
        exportData = this.convertToXML(userData);
        break;
      default:
        exportData = JSON.stringify(userData, null, 2);
    }

    this.logAuditEvent('user_data_exported', 'users', userId, { format, size: exportData.length });

    return exportData;
  }

  async deleteUserData(userId: string, dataTypes: string[] = ['all']): Promise<void> {
    this.checkPermission('users', 'delete', 'organization');

    if (dataTypes.includes('all') || dataTypes.includes('user')) {
      await this.deleteUser(userId);
    }

    if (dataTypes.includes('all') || dataTypes.includes('audit')) {
      const logs = this.auditLogs$.value.filter(log => log.userId !== userId);
      this.auditLogs$.next(logs);
    }

    this.logAuditEvent('user_data_deleted', 'users', userId, { dataTypes });
  }

  // Observables for reactive programming
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  getUsers(): Observable<User[]> {
    return this.users$.asObservable();
  }

  getOrganization(): Observable<Organization | null> {
    return this.organization$.asObservable();
  }

  getAuditLogsStream(): Observable<AuditLog[]> {
    return this.auditLogs$.asObservable();
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  // Private helper methods
  private async authenticateUser(credentials: { username: string; password: string }): Promise<User | null> {
    // Simulate authentication delay
    await this.delay(500);

    // Mock user data
    const mockUser: User = {
      id: 'user-1',
      username: credentials.username,
      email: `${credentials.username}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: this.defaultRoles[1], // teacher role
      department: 'Irodalomtudomány',
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date(),
      isActive: true,
      permissions: this.defaultRoles[1].permissions,
      settings: this.getDefaultUserSettings()
    };

    return mockUser;
  }

  private async authenticateSSO(provider: string, token: string): Promise<User | null> {
    // Simulate SSO authentication
    await this.delay(1000);

    // Mock SSO user
    const mockUser: User = {
      id: 'sso-user-1',
      username: 'sso.user',
      email: 'sso.user@university.edu',
      firstName: 'SSO',
      lastName: 'User',
      role: this.defaultRoles[2], // admin role
      department: 'IT',
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date(),
      isActive: true,
      permissions: this.defaultRoles[2].permissions,
      settings: this.getDefaultUserSettings()
    };

    return mockUser;
  }

  private getDefaultUserSettings(): UserSettings {
    return {
      theme: 'light',
      language: 'hu',
      notifications: {
        email: true,
        push: false,
        analysis: true,
        collaboration: true
      },
      privacy: {
        shareAnalytics: false,
        shareContent: true,
        allowTracking: false
      },
      workspacePreferences: {
        defaultView: 'analysis',
        autoSave: true,
        shortcuts: {}
      }
    };
  }

  private initializeOrganization(): void {
    const mockOrg: Organization = {
      id: 'org-1',
      name: 'Egyetemi Kutatóintézet',
      domain: 'university.edu',
      type: 'educational',
      settings: {
        singleSignOn: {
          enabled: false,
          provider: 'saml',
          configuration: {}
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireNumbers: true,
            requireSymbols: false,
            requireUppercase: true,
            expirationDays: 90
          },
          sessionTimeout: 3600000, // 1 hour
          ipRestrictions: [],
          twoFactorRequired: false
        },
        dataRetention: {
          analysisDays: 365,
          auditLogDays: 2555, // 7 years
          exportFormats: ['json', 'csv', 'xml']
        },
        collaboration: {
          maxCollaborators: 50,
          allowExternalSharing: true,
          defaultPermissions: []
        }
      },
      subscription: {
        plan: 'enterprise',
        features: ['advanced-analytics', 'sso', 'audit-logs', 'integrations'],
        limits: {
          users: 1000,
          storage: 10000, // GB
          analyses: -1 // unlimited
        },
        expiresAt: new Date('2024-12-31')
      },
      integrations: []
    };

    this.organization$.next(mockOrg);
  }

  private storeUserSession(user: User): void {
    localStorage.setItem('cadentis_session', JSON.stringify({
      userId: user.id,
      loginTime: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
  }

  private loadUserSession(): void {
    const session = localStorage.getItem('cadentis_session');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.expiresAt > Date.now()) {
          // Session is valid - would normally load user from server
          this.isAuthenticated$.next(true);
        } else {
          this.clearUserSession();
        }
      } catch (error) {
        this.clearUserSession();
      }
    }
  }

  private clearUserSession(): void {
    localStorage.removeItem('cadentis_session');
  }

  private setupAuditLogging(): void {
    // Setup periodic audit log cleanup
    setInterval(() => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30); // Keep logs for 30 days

      const logs = this.auditLogs$.value.filter(log => log.timestamp > cutoff);
      this.auditLogs$.next(logs);
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private getClientIP(): string {
    // In real implementation, this would get actual client IP
    return '192.168.1.100';
  }

  private generateId(): string {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion
    return Object.keys(data).join(',') + '\n' + Object.values(data).join(',');
  }

  private convertToXML(data: any): string {
    // Simple XML conversion
    return '<?xml version="1.0"?><data>' + JSON.stringify(data) + '</data>';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
