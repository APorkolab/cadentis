import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VerseFormService {
  private verseFormsUrl = './../core/verse-forms.json';

  constructor(private http: HttpClient) { }

  getVerseForms(): Observable<any> {
    return this.http.get(this.verseFormsUrl);
  }
}
