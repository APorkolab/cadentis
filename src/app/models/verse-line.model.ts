export interface VerseLine {
	meterPattern: string;     // Időmérték mintája (pl. "-U---UU-U-")
	syllableCount: number;    // Szótagszám
	verseType: string;        // Versforma (pl. "szapphói sor")
	text: string;             // A verssor szövege
	rhymeScheme: string;      // Rímképlet (pl. "a", "b", stb.)
}
