import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { fadeInAnimation } from '../../animations';

@Component({
  selector: 'app-verse-documentation',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="documentation-container" @fadeIn>
      <h1 class="title">Magyar Verselés Dokumentációja</h1>
      
      <mat-tab-group>
        <mat-tab label="Időmértékes Verselés">
          <div class="tab-content">
            <mat-card class="section-card">
              <mat-card-header>
                <mat-card-title>Időmértékes verselés alapjai</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Az időmértékes verselés a szótagok hosszúságán alapul. A magyar nyelvben a szótaghosszúságot főként a magánhangzók hosszúsága és az őket követő mássalhangzók száma határozza meg.</p>
                
                <h3>Szótaghosszúság megállapítása:</h3>
                <ul>
                  <li><strong>Rövid szótag (∪):</strong> rövid magánhangzó + egy vagy nulla mássalhangzó</li>
                  <li><strong>Hosszú szótag (–):</strong> hosszú magánhangzó VAGY rövid magánhangzó + két vagy több mássalhangzó</li>
                </ul>

                <mat-divider class="section-divider"></mat-divider>

                <h3>Alapvető verslábak:</h3>
                <mat-accordion>
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Jambus (∪–)</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Rövid-hosszú sorrend. Például: "szerelem"</p>
                    <p class="example">se-re-lem → ∪–∪</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Trocheus (–∪)</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Hosszú-rövid sorrend. Például: "élet"</p>
                    <p class="example">é-let → –∪</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Daktilus (–∪∪)</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Hosszú-rövid-rövid sorrend. Például: "bánatom"</p>
                    <p class="example">bá-na-tom → –∪∪</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Anapesztus (∪∪–)</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Rövid-rövid-hosszú sorrend. Például: "szerelem"</p>
                    <p class="example">sze-re-lem → ∪∪–</p>
                  </mat-expansion-panel>
                </mat-accordion>
              </mat-card-content>
            </mat-card>

            <mat-card class="section-card">
              <mat-card-header>
                <mat-card-title>Hexameter</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>A hexameter hat verslábból áll, mely daktilus (–∪∪) vagy spondeus (––) lehet.</p>
                <p><strong>Séma:</strong> –∪∪|–∪∪|–∪∪|–∪∪|–∪∪|–∪</p>
                
                <h4>Példa:</h4>
                <div class="example-verse">
                  <p>"Énekelj múzsám haragos Akhilleusz dicsőségéről"</p>
                  <p class="pattern">–∪∪|–∪∪|–∪∪|–∪∪|–∪∪|–∪</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Szótagszámlálás">
          <div class="tab-content">
            <mat-card class="section-card">
              <mat-card-header>
                <mat-card-title>Magyar szótagolás szabályai</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h3>Alapelvek:</h3>
                <ul>
                  <li>Minden szótagnak van magánhangzója</li>
                  <li>A mássalhangzók a következő szótaghoz kapcsolódnak</li>
                  <li>Kettős mássalhangzók szétválnak</li>
                </ul>

                <h3>Különleges esetek:</h3>
                <mat-accordion>
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Diftongusok</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Két magánhangzó egy szótagot alkot: au, eu, ou</p>
                    <p class="example">au-tó, Eu-ró-pa</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Mássalhangzó-torlódás</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Több mássalhangzó esetén az első az előző szótaghoz, a többi a következőhöz tartozik</p>
                    <p class="example">könyv → könyv, templom → tem-plom</p>
                  </mat-expansion-panel>
                </mat-accordion>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Prozódia szabályok">
          <div class="tab-content">
            <mat-card class="section-card">
              <mat-card-header>
                <mat-card-title>Magyar prozódia különlegességei</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h3>Hangsúly és hosszúság:</h3>
                <p>A magyarban a szóhangsúly általában az első szótagon van, de ez nem feltétlenül jelenti azt, hogy az első szótag hosszú is egyben.</p>

                <h3>Kétbetűs mássalhangzók:</h3>
                <mat-chip-set>
                  <mat-chip>cs</mat-chip>
                  <mat-chip>dz</mat-chip>
                  <mat-chip>dzs</mat-chip>
                  <mat-chip>gy</mat-chip>
                  <mat-chip>ly</mat-chip>
                  <mat-chip>ny</mat-chip>
                  <mat-chip>sz</mat-chip>
                  <mat-chip>ty</mat-chip>
                  <mat-chip>zs</mat-chip>
                </mat-chip-set>
                <p>Ezek egy mássalhangzóként számítanak a prozódiában.</p>

                <h3>Mórabecslés:</h3>
                <p>A mora az időtartam alapegysége:</p>
                <ul>
                  <li>Rövid szótag = 1 mora</li>
                  <li>Hosszú szótag = 2 mora</li>
                </ul>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Versformák">
          <div class="tab-content">
            <mat-card class="section-card">
              <mat-card-header>
                <mat-card-title>Főbb magyar versformák</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-accordion>
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Alexandrin</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>12 szótagos sorok, caesurával a 6. szótag után</p>
                    <p class="example">6+6 szótag | cezúra a közepén</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Felező tizenkettes</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>Magyar nemzeti versforma, 12 szótagos sorok 6+6-os tagolással</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Római strófák</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>11-11-5-11 szótagos sorok, ABAB rímrendszerrel</p>
                  </mat-expansion-panel>
                </mat-accordion>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .documentation-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .title {
      text-align: center;
      margin-bottom: 24px;
      color: #2c3e50;
    }

    .tab-content {
      padding: 16px 0;
    }

    .section-card {
      margin-bottom: 16px;
    }

    .section-divider {
      margin: 16px 0;
    }

    .example {
      font-family: 'Courier New', monospace;
      background-color: #f8f9fa;
      padding: 8px;
      border-radius: 4px;
      font-size: 0.9rem;
      margin: 8px 0;
    }

    .example-verse {
      background-color: #f0f8ff;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .example-verse p {
      margin: 4px 0;
    }

    .pattern {
      font-family: 'Courier New', monospace;
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: bold;
    }

    h3 {
      color: #34495e;
      margin-top: 16px;
    }

    h4 {
      color: #34495e;
      margin-top: 12px;
    }

    ul {
      line-height: 1.6;
    }

    mat-chip-set {
      margin: 8px 0;
    }

    mat-expansion-panel {
      margin-bottom: 8px;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      padding-top: 16px;
    }
  `]
})
export class VerseDocumentationComponent {
}
