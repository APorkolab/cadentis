import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { VerseForm } from '../models/verse-form.model';

@Injectable({
  providedIn: 'root'
})
export class VerseFormService {
  private verseForms = [
    {
      // Complete Hungarian metrical feet based on mora count
      "TwoMoraic": [
        { "formName": "pirrichius", "pattern": "UU", "moras": 2, "nickname": "pici", "example": "csoki" }
      ],
      "ThreeMoraic": [
        { "formName": "tribrakhisz", "pattern": "UUU", "moras": 3, "nickname": "szapora", "example": "szerepe" },
        { "formName": "jambus", "pattern": "U-", "moras": 3, "nickname": "szökő", "example": "vadász" },
        { "formName": "trocheus", "pattern": "-U", "moras": 3, "nickname": "perge, lejti", "example": "Béni" }
      ],
      "FourMoraic": [
        { "formName": "anapesztus", "pattern": "UU-", "moras": 4, "nickname": "lebegő, doboró", "example": "csodaszép" },
        { "formName": "daktilus", "pattern": "-UU", "moras": 4, "nickname": "lengedi, görgedi", "example": "éjszaka" },
        { "formName": "spondeus", "pattern": "--", "moras": 4, "nickname": "lassú, lépő", "example": "forró" },
        { "formName": "proceleuzmatikus", "pattern": "UUUU", "moras": 4, "nickname": "futamodi", "example": "csiribiri" },
        { "formName": "amphibrakhisz", "pattern": "U-U", "moras": 4, "nickname": "körösdi", "example": "ki látta?" }
      ],
      "FiveMoraic": [
        { "formName": "bacchius", "pattern": "U--", "moras": 5, "nickname": "toborzó", "example": "valóság" },
        { "formName": "palimbacchius", "pattern": "--U", "moras": 5, "nickname": "tomboldi", "example": "őrjöngve" },
        { "formName": "krétikus", "pattern": "-U-", "moras": 5, "nickname": "ugrató", "example": "óh, az éj!" },
        { "formName": "pentabrakhisz", "pattern": "UUUUU", "moras": 5, "nickname": "eliramodi", "example": "csodaparipa" },
        { "formName": "paión 1", "pattern": "-UUU", "moras": 5, "nickname": "pergepici", "example": "hársfatea" },
        { "formName": "paión 2", "pattern": "UUU-", "moras": 5, "nickname": "piciszökő", "example": "borogatás" }
      ],
      "SixMoraic": [
        { "formName": "kis jónikus", "pattern": "UU--", "moras": 6, "nickname": "picilépő", "example": "szerelemnek" },
        { "formName": "nagy jónikus", "pattern": "--UU", "moras": 6, "nickname": "lépőpici", "example": "álombeli" },
        { "formName": "antiszpasztus", "pattern": "U--U", "moras": 6, "nickname": "toborzéki", "example": "barangolni" },
        { "formName": "koriambus", "pattern": "-UU-", "moras": 6, "nickname": "lengedő", "example": "alszik a vár" },
        { "formName": "molosszus", "pattern": "---", "moras": 6, "nickname": "andalgó", "example": "száncsengő" }
      ],
      "ClassicalMeters": [
        {
          "formName": "hexameter",
          "pattern": "-=|-=|-=|-=|-UU|-x",
          "description": "Hat versláb: daktilus vagy spondeus, az utóelőtti mindig daktilus",
          "substitutions": "Az '=' helyen daktilus (-UU) vagy spondeus (--) állhat"
        },
        {
          "formName": "pentameter",
          "pattern": "-=|-=|-||-UU|-UU|-",
          "description": "Hat fél versláb (3. és 6. csonka)",
          "caesura": "A harmadik láb után mindig szedés"
        },
        {
          "formName": "disztichon",
          "pattern": "hexameter/pentameter",
          "description": "Egy hexameter + egy pentameter pár",
          "rhyme": false
        }
      ]
    }
  ];

  constructor() {
    // No complex pattern initialization needed with new structure
  }

  private matchPattern(inputPattern: string, versePattern: string): boolean {
    // Az `inputPattern` és `versePattern` összevetése az '=' figyelembevételével
    // és a regex metakarakterek biztonságos kezelése.
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Először escape-eljük, majd visszacseréljük a használt helyettesítőinket
    let patternEscaped = escapeRegex(versePattern);
    patternEscaped = patternEscaped
      .replace(/=/g, '(UU|-)') // '=': hosszú vagy két rövid
      .replace(/\\\?/g, '.') // '?' (escaped by escapeRegex) -> tetszőleges egy jel
      .replace(/\\\|/g, '\\|'); // '|' maradjon literal vagy alternáció? Ha alternációt szeretnénk, hagyjuk így.
    const regex = new RegExp(`^${patternEscaped}$`);
    return regex.test(inputPattern);
  }

  getVerseForms(): Observable<VerseForm[]> {
    return of(this.verseForms.flatMap(formType => {
      return Object.entries(formType).flatMap(([category, forms]) => {
        if (!Array.isArray(forms)) return [];
        return forms.map(form => ({
          formName: form.formName,
          pattern: form.pattern,
          moraCount: (form as any).moras || this.calculateMoraCount(form.pattern || ''),
          category
        }));
      });
    }));
  }

  private calculateMoraCount(pattern: string): number {
    // Count moras by weighting: U = 1 mora, - = 2 moras. Ignore other symbols (e.g., |, /, =, ?).
    const normalized = pattern.replace(/\s/g, '');
    let moras = 0;
    for (const ch of normalized) {
      if (ch === 'U') moras += 1;
      else if (ch === '-') moras += 2;
      // '=' is handled when assembling complex patterns (turned into (UU|-)),
      // so here we ignore it to avoid double-counting.
    }
    return moras;
  }
}
