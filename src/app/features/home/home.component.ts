import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <h1>Cadentis - Advanced Angular Application</h1>
      <p>Welcome to our enterprise-grade Angular application with comprehensive security features.</p>
      
      <div class="features-grid">
        <div class="feature-card">
          <h3>🔐 Security</h3>
          <p>Advanced security features including XSS protection, CSRF tokens, CSP, and encryption.</p>
          <button routerLink="/security" class="btn">View Security Dashboard</button>
        </div>
        
        <div class="feature-card">
          <h3>🧪 Testing</h3>
          <p>Comprehensive testing excellence with unit, integration, E2E, performance, and accessibility tests.</p>
          <button routerLink="/testing" class="btn">View Testing Dashboard</button>
        </div>
        
        <div class="feature-card">
          <h3>📱 Progressive Web App</h3>
          <p>PWA features with offline support, push notifications, and native app-like experience.</p>
          <button routerLink="/pwa" class="btn">View PWA Dashboard</button>
        </div>
        
        <div class="feature-card">
          <h3>🏗️ Architecture</h3>
          <p>Enterprise-grade architecture with NgRx state management and reactive patterns.</p>
        </div>
        
        <div class="feature-card">
          <h3>🚀 Performance</h3>
          <p>Optimized for performance with virtual scrolling, lazy loading, and monitoring.</p>
        </div>
        
        <div class="feature-card">
          <h3>♿ Accessibility</h3>
          <p>WCAG 2.1 AA compliant with full keyboard navigation and screen reader support.</p>
        </div>
        
        <div class="feature-card">
          <h3>🌍 i18n</h3>
          <p>Multi-language support with RTL support and locale-specific formatting.</p>
        </div>
        
        <div class="feature-card">
          <h3>📊 Analytics</h3>
          <p>Comprehensive analytics and monitoring for insights and performance tracking.</p>
          <button routerLink="/analytics" class="btn">View Analytics Dashboard</button>
        </div>
        
        <div class="feature-card">
          <h3>📚 Documentation & DevOps</h3>
          <p>Complete documentation system with API docs, deployment guides, CI/CD pipelines, and DevOps excellence practices.</p>
          <button routerLink="/documentation" class="btn">View Documentation Dashboard</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 2.5rem;
    }
    
    p {
      color: #7f8c8d;
      font-size: 1.2rem;
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-top: 40px;
    }
    
    .feature-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }
    
    .feature-card h3 {
      color: #2c3e50;
      margin-bottom: 15px;
      font-size: 1.5rem;
    }
    
    .feature-card p {
      color: #7f8c8d;
      margin-bottom: 20px;
      font-size: 1rem;
      text-align: left;
    }
    
    .btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      text-decoration: none;
      display: inline-block;
      transition: background 0.3s ease;
    }
    
    .btn:hover {
      background: #2980b9;
    }
  `]
})
export class HomeComponent {}
