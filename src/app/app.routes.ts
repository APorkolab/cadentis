import { Routes } from '@angular/router';
import { QuantitativeAnalyzerComponent } from './features/quantitative-analyzer/quantitative-analyzer.component';
import { VerseDocumentationComponent } from './features/verse-documentation/verse-documentation.component';
import { AboutComponent } from './features/about/about.component';

export const routes: Routes = [
  { path: '', redirectTo: '/analyzer', pathMatch: 'full' },
  { path: 'analyzer', component: QuantitativeAnalyzerComponent },
  { path: 'documentation', component: VerseDocumentationComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '/analyzer' }
];
