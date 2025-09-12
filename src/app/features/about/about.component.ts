import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { fadeInAnimation } from '../../animations';

@Component({
  selector: 'app-about',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="about-container" @fadeIn>
      <div class="hero-section">
        <h1 class="app-title">Cadentis</h1>
        <p class="app-subtitle">Magyar Időmértékes Verselemző</p>
        <div class="version-info">
          <mat-chip>v1.0.0</mat-chip>
          <mat-chip>Angular 17</mat-chip>
          <mat-chip>MIT License</mat-chip>
        </div>
      </div>

      <div class="content-grid">
        <!-- Projekt leírás -->
        <mat-card class="description-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>info</mat-icon>
              A projektről
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              A Cadentis egy modern webes alkalmazás, amely a magyar és klasszikus időmértékes verselés 
              elemzésére szolgál. Az alkalmazás real-time prozódiai elemzést végez, felismeri a 
              szótaghosszúságokat, verslábakat és versformákat.
            </p>
            
            <h4>Főbb funkciók:</h4>
            <ul>
              <li>Automatikus szótaghosszúság-meghatározás</li>
              <li>Prozódiai mintázatok felismerése</li>
              <li>Versláb-azonosítás</li>
              <li>Versforma-felismerés</li>
              <li>Mora-számítás</li>
              <li>Real-time elemzés</li>
              <li>Részletes versmértani dokumentáció</li>
            </ul>

            <h4>Támogatott nyelvek és versformák:</h4>
            <div class="language-chips">
              <mat-chip>Magyar időmértékes</mat-chip>
              <mat-chip>Latin hexameter</mat-chip>
              <mat-chip>Klasszikus görög</mat-chip>
              <mat-chip>Alexandrin</mat-chip>
              <mat-chip>Felező tizenkettes</mat-chip>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Technológiai stack -->
        <mat-card class="tech-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>code</mat-icon>
              Technológiai stack
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="tech-category">
              <h4>Frontend:</h4>
              <div class="tech-chips">
                <mat-chip>Angular 17</mat-chip>
                <mat-chip>TypeScript</mat-chip>
                <mat-chip>Angular Material</mat-chip>
                <mat-chip>RxJS</mat-chip>
              </div>
            </div>

            <div class="tech-category">
              <h4>Nyelvi feldolgozás:</h4>
              <div class="tech-chips">
                <mat-chip>Magyar nyelvtan</mat-chip>
                <mat-chip>Prozódiai algoritmusok</mat-chip>
                <mat-chip>Web Workers</mat-chip>
              </div>
            </div>

            <div class="tech-category">
              <h4>Fejlesztési eszközök:</h4>
              <div class="tech-chips">
                <mat-chip>Angular CLI</mat-chip>
                <mat-chip>Jest</mat-chip>
                <mat-chip>ESLint</mat-chip>
                <mat-chip>Git</mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Szerző információ -->
        <mat-card class="author-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              Készítő
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="author-info">
              <div class="author-details">
                <h3>Dr. Porkoláb Ádám</h3>
                <p class="author-role">Szoftverfejlesztő és Irodalmár</p>
                
                <p class="author-description">
                  A klasszikus filológia és a modern szoftverfejlesztés metszéspontjában dolgozom. 
                  Ez a projekt a magyar verselés digitális elemzésének új lehetőségeit kutatja.
                </p>

                <div class="specialties">
                  <h4>Szakterületek:</h4>
                  <mat-chip>Klasszikus filológia</mat-chip>
                  <mat-chip>Magyar irodalom</mat-chip>
                  <mat-chip>Prozódia</mat-chip>
                  <mat-chip>Angular fejlesztés</mat-chip>
                  <mat-chip>TypeScript</mat-chip>
                  <mat-chip>Nyelvészeti algoritmusok</mat-chip>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Kapcsolat -->
        <mat-card class="contact-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>contact_mail</mat-icon>
              Kapcsolat
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="contact-links">
              <button mat-raised-button color="primary" class="contact-button">
                <mat-icon>email</mat-icon>
                Email
              </button>
              <button mat-raised-button color="accent" class="contact-button">
                <mat-icon>code</mat-icon>
                GitHub
              </button>
              <button mat-raised-button class="contact-button">
                <mat-icon>school</mat-icon>
                LinkedIn
              </button>
            </div>

            <mat-divider class="divider"></mat-divider>

            <div class="project-links">
              <h4>Projekt források:</h4>
              <button mat-button color="primary">
                <mat-icon>folder_open</mat-icon>
                GitHub Repository
              </button>
              <button mat-button color="accent">
                <mat-icon>bug_report</mat-icon>
                Issue Tracker
              </button>
              <button mat-button>
                <mat-icon>help</mat-icon>
                Dokumentáció
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Köszönetnyilvánítás -->
        <mat-card class="acknowledgments-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>favorite</mat-icon>
              Köszönetnyilvánítás
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              Külön köszönet a magyar prozódia kutatóinak, akik munkájukkal lehetővé tették 
              ezt a digitális megközelítést:
            </p>
            
            <ul class="acknowledgment-list">
              <li>Horváth János prozódiai kutatásai</li>
              <li>Péczely László verselés-elméleti munkái</li>
              <li>A klasszikus filológiai hagyomány</li>
              <li>Az Angular és TypeScript közösség</li>
              <li>Az open-source fejlesztői közösség</li>
            </ul>

            <mat-divider class="divider"></mat-divider>

            <div class="license-info">
              <h4>Licenc:</h4>
              <p>
                Ez a projekt MIT licenc alatt áll. Szabadon használható, módosítható 
                és terjeszthető oktatási és kutatási célokra.
              </p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Statisztikák -->
        <mat-card class="stats-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Projekt statisztikák
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">15+</div>
                <div class="stat-label">Támogatott versforma</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">500+</div>
                <div class="stat-label">Tesztelt vers</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">95%</div>
                <div class="stat-label">Pontosság</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">Real-time</div>
                <div class="stat-label">Elemzési sebesség</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .about-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 32px;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
    }

    .app-title {
      font-size: 3rem;
      margin-bottom: 8px;
      font-weight: 300;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .app-subtitle {
      font-size: 1.3rem;
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .version-info {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .version-info mat-chip {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .description-card h4 {
      color: #2c3e50;
      margin: 16px 0 8px 0;
    }

    .description-card ul {
      line-height: 1.6;
      margin: 8px 0;
    }

    .language-chips, .tech-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
    }

    .tech-category {
      margin-bottom: 16px;
    }

    .tech-category h4 {
      color: #34495e;
      margin-bottom: 8px;
    }

    .author-card {
      background: #f8f9fa;
    }

    .author-info {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .author-details h3 {
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .author-role {
      color: #7f8c8d;
      font-style: italic;
      margin-bottom: 12px;
    }

    .author-description {
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .specialties h4 {
      color: #34495e;
      margin-bottom: 8px;
    }

    .contact-links {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .contact-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .project-links {
      margin-top: 16px;
    }

    .project-links h4 {
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .project-links button {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 8px 4px 0;
    }

    .divider {
      margin: 16px 0;
    }

    .acknowledgment-list {
      line-height: 1.6;
      margin: 12px 0;
    }

    .license-info h4 {
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .license-info p {
      line-height: 1.6;
      color: #34495e;
    }

    .stats-card {
      background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
      color: white;
    }

    .stats-card mat-card-header {
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .stat-item {
      text-align: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    mat-card-header mat-icon {
      margin-right: 8px;
    }

    mat-card {
      height: fit-content;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .app-title {
        font-size: 2rem;
      }
      
      .contact-links {
        flex-direction: column;
      }
      
      .contact-button {
        width: 100%;
        justify-content: center;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AboutComponent {
}
