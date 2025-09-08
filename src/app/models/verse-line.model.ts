import { MetricalDirection } from './verse.enums';

export class VerseLine {
  meterPattern = '';
  syllableCount = 0;
  moraCount = 0;
  verseType = ''; // Can be a string or a VerseType enum member
  text = '';
  rhymeScheme = '';
  substitutions: string[] = [];
  lejtesirany = MetricalDirection.Mixed;
  isDisztichonPart = false;
}
