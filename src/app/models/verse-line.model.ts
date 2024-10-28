export interface VerseLine {
	meterPattern: string;     // Időmérték mintája (pl. "-U---UU-U-")
	syllableCount: number;    // Szótagszám
	moraCount: number;        // Mora szám
	verseType: string;        // Versforma (pl. "szapphói sor")
	text: string;             // A verssor szövege
	rhymeScheme: string;      // Rímképlet (pl. "a", "b", stb.)
	substitutions: string[];  // Helyettesítések listája
	lejtesirany: 'emelkedő' | 'ereszkedő' | 'vegyes';
	isDisztichonPart?: boolean;  // új tulajdonság
}
