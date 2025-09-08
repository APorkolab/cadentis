export interface VerseForm {
	pattern: string;   // A versforma mintája (pl. "-U---UU-U-")
	formName: string;  // A versforma neve (pl. "szapphói sor")
	moraCount: number; // A versforma mora száma
	category?: string; // A versforma kategóriája (pl. "Verslábak", "Kolónok", "Sorfajták")
	syllables?: number; // A szótagok száma (ha van)
}
