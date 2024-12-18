import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { VerseForm } from '../models/verse-form.model';

@Injectable({
  providedIn: 'root'
})
export class VerseFormService {
  private verseForms = [
    {
      "Verslábak": [
        { "formName": "ta láb", "pattern": "-" },
        { "formName": "ti láb", "pattern": "U" },
        { "formName": "jambus láb", "pattern": "U-" },
        { "formName": "trocheus láb", "pattern": "-U" },
        { "formName": "daktilus láb", "pattern": "-UU" },
        { "formName": "anapesztus láb", "pattern": "UU-" },
        { "formName": "spondeusz láb", "pattern": "--" },
        { "formName": "pirrichius láb", "pattern": "UU" },
        { "formName": "molosszus láb", "pattern": "---" },
        { "formName": "tribrachisz láb", "pattern": "UUU" },
        { "formName": "proceleuzmatikus láb", "pattern": "UUUU" }
      ],
      "Kolónok": [
        { "formName": "bacchius kolón", "pattern": "U--", "syllables": 3 },
        { "formName": "palimbacchius kolón", "pattern": "--U", "syllables": 3 },
        { "formName": "kretikus kolón", "pattern": "-U-", "syllables": 3 },
        { "formName": "amphibrachisz kolón", "pattern": "U-U", "syllables": 3 },
        { "formName": "1. paion kolón", "pattern": "-UUU", "syllables": 4 },
        { "formName": "2. paion kolón", "pattern": "U-UU", "syllables": 4 },
        { "formName": "3. paion kolón", "pattern": "UU-U", "syllables": 4 },
        { "formName": "4. paion kolón", "pattern": "UUU-", "syllables": 4 },
        { "formName": "1. epitritus kolón", "pattern": "U---", "syllables": 4 },
        { "formName": "2. epitritus kolón", "pattern": "-U--", "syllables": 4 },
        { "formName": "3. epitritus kolón", "pattern": "--U-", "syllables": 4 },
        { "formName": "4. epitritus kolón", "pattern": "---U", "syllables": 4 },
        { "formName": "ionicus a minore kolón", "pattern": "UU--", "syllables": 4 },
        { "formName": "ionicus a maiore kolón", "pattern": "--UU", "syllables": 4 },
        { "formName": "choriambus kolón", "pattern": "-UU-", "syllables": 4 },
        { "formName": "antiszpasztus kolón", "pattern": "U--U", "syllables": 4 }
      ],
      "Sorfajták": [
        { "formName": "hexameter", "pattern": "-=|-=|-=|-=|-UU|-?", "syllables": 6 },
        { "formName": "pentameter", "pattern": "-=|-=|-||-UU|-UU|?", "syllables": 6 },
        { "formName": "phalaikoszi", "pattern": "UU-UU-U-U--", "syllables": 11 },
        { "formName": "hendecasyllabus/B", "pattern": "U--UU-U-U-?", "syllables": 11 },
        { "formName": "4mtr trochaicus", "pattern": "-U-U-U-U-U-U-U-", "syllables": 8 },
        { "formName": "francia alexandrin A", "pattern": "-U--U-||-UU-U-?", "syllables": 12 },
        { "formName": "trimeter iambicus", "pattern": "U-U-U-U-U-U?", "syllables": 6 }
      ],
      "ComplexForms": [
        { "formName": "bi_adoniszi.fictive", "components": ["adoniszi kolon", "adoniszi kolon"] },
        { "formName": "nibelungizált alexandrin", "components": ["nib.alex.1.fictive", "||--|--|U-|?"] },
        { "formName": "szapphoi", "components": ["szapphói sor", "szapphói sor", "szapphói sor", "adoniszi kolon"] }
      ],
      "StrophesAndLines": [
        {
          "formName": "asklepiadesi_A123_A123",
          "pattern": "asklepiadesi_A123/asklepiadesi_A123"
        },
        {
          "formName": "asklepiadesi_D13_A123",
          "pattern": "asklepiadesi_D13/asklepiadesi_A123"
        },
        {
          "formName": "asklepiadesi_E1234_E1234",
          "pattern": "asklepiadesi_E1234/asklepiadesi_E1234"
        },
        {
          "formName": "asklepiadesi_A",
          "pattern": "asklepiadesi_A123_A123/asklepiadesi_A123_A123"
        },
        {
          "formName": "asklepiadesi_B",
          "pattern": "asklepiadesi_A123_A123/asklepiadesi_A123/asklepiadesi_B4"
        },
        {
          "formName": "asklepiadesi_C",
          "pattern": "asklepiadesi_A123_A123/asklepiadesi_C3/asklepiadesi_B4"
        },
        {
          "formName": "asklepiadesi_D",
          "pattern": "asklepiadesi_D13_A123/asklepiadesi_D13_A123"
        },
        {
          "formName": "asklepiadesi_E",
          "pattern": "asklepiadesi_E1234_E1234/asklepiadesi_E1234_E1234"
        },
        {
          "formName": "alkaiosi",
          "pattern": "alkaiosi_12/alkaiosi_12/alkaiosi_3/alkaiosi_4"
        },
        {
          "formName": "Szeptember végén rimkeplet=ababcdcd",
          "pattern": "Szept_vegen_1212_1212"
        },
        {
          "formName": "disztichon",
          "pattern": "hexameter/pentameter"
        },
        {
          "formName": "2_ionicus_a_min",
          "pattern": "ionicus_a_minore_kolon/ionicus_a_minore_kolon"
        },
        {
          "formName": "anakreoni 16",
          "pattern": "2_ionicus_a_min/2_ionicus_a_min"
        },
        {
          "formName": "sapphoi",
          "pattern": "szapphoi_sor/szapphoi_sor/szapphoi_sor/adoniszi_kolon"
        },
        {
          "formName": "pnl_1",
          "pattern": "molosszus_lab/proceleuzmatikus_lab"
        },
        {
          "formName": "pnl_2",
          "pattern": "pnl_1/pnl_1"
        },
        {
          "formName": "pnl_3",
          "pattern": "pnl_2/pnl_2"
        },
        {
          "formName": "pnl_4",
          "pattern": "molosszus_lab/pirrichius_lab"
        },
        {
          "formName": "pnl_5",
          "pattern": "pirrichius_lab/pnl_3"
        },
        {
          "formName": "pnl_6",
          "pattern": "pnl_5/pnl_4"
        },
        {
          "formName": "hal éji éneke",
          "pattern": "ta_lab/pnl_6/ta_lab"
        }
      ]
    }
  ];

  constructor() {
    this.initializeComplexPatterns();
  }

  private initializeComplexPatterns() {
    const allPatterns = this.collectAllPatterns();
    this.verseForms.forEach(formType => {
      formType.ComplexForms.forEach((complexForm: any) => {
        complexForm.pattern = this.assemblePattern(complexForm.components, allPatterns);
      });
    });
  }

  private collectAllPatterns(): Map<string, string> {
    const allPatterns = new Map<string, string>();

    this.verseForms.forEach(formType => {
      ["Verslábak", "Kolónok", "Sorfajták", "StrophesAndLines"].forEach((category) => {
        (formType[category as keyof typeof formType] || []).forEach((item: any) => {
          allPatterns.set(item.formName, item.pattern);
        });
      });
    });

    return allPatterns;
  }

  private assemblePattern(components: string[], allPatterns: Map<string, string>): string {
    return components
      .map(component => allPatterns.get(component) || "")
      .join('')
      .replace(/=/g, '(UU|-)'); // Az '=' jel kezelése hosszú vagy két rövid szótagként
  }

  private matchPattern(inputPattern: string, versePattern: string): boolean {
    // Az `inputPattern` és `versePattern` összevetése az '=' figyelembevételével
    const regex = new RegExp(`^${versePattern.replace(/=/g, '(UU|-)').replace(/\?/g, '.')}$`);
    return regex.test(inputPattern);
  }

  getVerseForms(): Observable<VerseForm[]> {
    return of(this.verseForms.flatMap(formType => {
      return Object.entries(formType).flatMap(([category, forms]) =>
        (forms as VerseForm[]).map(form => ({
          ...form,
          moraCount: form.pattern ? this.calculateMoraCount(form.pattern) : 0,
          category
        }))
      );
    }));
  }

  private calculateMoraCount(pattern: string): number {
    const normalizedPattern = pattern.replace(/\?/g, '');
    return normalizedPattern.split('').filter(char => /[U-]/.test(char)).length;
  }
}
