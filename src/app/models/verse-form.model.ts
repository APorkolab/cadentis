export interface VerseForm {
	pattern: string;   // A versforma mintája (pl. "-U---UU-U-")
	formName: string;  // A versforma neve (pl. "szapphói sor")
	moraCount: number; // A versforma mora száma
	type: 'versláb' | 'kólon' | 'periódus'; // A versforma típusa
}