// Debug script to analyze the expected patterns and syllables

const testCases = [
  {
    text: "Eddig Itália földjén termettek csak a könyvek",
    expected: "-UU-UU-----UU--",
    syllables: ['ed', 'dig', 'i', 'tá', 'li', 'a', 'föl', 'djén', 'ter', 'met', 'tek', 'csak', 'a', 'kön', 'yvek']
  },
  {
    text: "S most Pannónia is ontja a szép dalokat",
    expected: "--UUU-UU-UU-",
    syllables: ['most', 'pan', 'nó', 'ni', 'a', 'is', 'on', 'tja', 'a', 'szép', 'da', 'lo', 'kat']
  },
  {
    text: "Sokra becsülnek már, a hazám is büszke lehet rám",
    expected: "-UU-U--UU-U-UUU--",
    syllables: ['sok', 'ra', 'bec', 'sül', 'nek', 'már', 'a', 'ha', 'zám', 'is', 'büs', 'zke', 'le', 'het', 'rám']
  },
  {
    text: "Szellemem egyre dicsőbb, s általa híres e föld",
    expected: "-UUU-UU--UUU-UU-",
    syllables: ['szel', 'le', 'mem', 'eg', 'yre', 'dic', 'sőbb', 'ál', 'ta', 'la', 'hí', 'res', 'e', 'föld']
  }
];

function analyzePatternsVsSyllables() {
  console.log("=== Analysis of Expected Patterns vs Syllables ===\n");
  
  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: "${testCase.text}"`);
    console.log(`Expected Pattern: ${testCase.expected}`);
    console.log(`Syllables: ${testCase.syllables.join(', ')}`);
    
    if (testCase.syllables.length !== testCase.expected.length) {
      console.log(`ERROR: Pattern length (${testCase.expected.length}) doesn't match syllable count (${testCase.syllables.length})`);
      return;
    }
    
    console.log("Syllable-by-syllable analysis:");
    for (let i = 0; i < testCase.syllables.length; i++) {
      const syllable = testCase.syllables[i];
      const expectedLength = testCase.expected[i];
      
      // Basic analysis
      const hasLongVowel = /[áéíóőúű]/.test(syllable);
      const vowels = syllable.match(/[aáeéiíoóöőuúüű]/g) || [];
      const consonantsAfterVowel = syllable.replace(/^.*?[aáeéiíoóöőuúüű]/, '');
      
      console.log(`  ${i + 1}. "${syllable}" -> ${expectedLength} | Long vowel: ${hasLongVowel} | Consonants after vowel: "${consonantsAfterVowel}"`);
    }
    console.log("");
  });
  
  // Look for patterns in what makes syllables long vs short
  console.log("=== Pattern Analysis ===");
  const longSyllables = [];
  const shortSyllables = [];
  
  testCases.forEach(testCase => {
    for (let i = 0; i < testCase.syllables.length; i++) {
      const syllable = testCase.syllables[i];
      const isLong = testCase.expected[i] === '-';
      
      if (isLong) {
        longSyllables.push(syllable);
      } else {
        shortSyllables.push(syllable);
      }
    }
  });
  
  console.log(`Long syllables: ${longSyllables.join(', ')}`);
  console.log(`Short syllables: ${shortSyllables.join(', ')}`);
}

analyzePatternsVsSyllables();
