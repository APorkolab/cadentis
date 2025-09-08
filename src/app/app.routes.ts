import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { SecurityDashboardComponent } from './features/security-dashboard/security-dashboard.component';
import { TestingDashboardComponent } from './features/testing-dashboard/testing-dashboard.component';
import { PWADashboardComponent } from './features/pwa-dashboard/pwa-dashboard.component';
import { AnalyticsDashboardComponent } from './features/analytics/analytics-dashboard/analytics-dashboard.component';
import { DocumentationDashboardComponent } from './features/documentation/documentation-dashboard/documentation-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'security', component: SecurityDashboardComponent },
  { path: 'testing', component: TestingDashboardComponent },
  { path: 'pwa', component: PWADashboardComponent },
  { path: 'analytics', component: AnalyticsDashboardComponent },
  { path: 'documentation', component: DocumentationDashboardComponent },
  { path: '**', redirectTo: '/home' }
];
