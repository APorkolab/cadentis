import { MetricalDirection } from './verse.enums';

export class VerseLine {
  meterPattern: string = '';
  syllableCount: number = 0;
  moraCount: number = 0;
  verseType: string = ''; // Can be a string or a VerseType enum member
  text: string = '';
  rhymeScheme: string = '';
  substitutions: string[] = [];
  lejtesirany: MetricalDirection = MetricalDirection.Mixed;
  isDisztichonPart: boolean = false;
}
