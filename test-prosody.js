// Simple test script to verify Hungarian prosodic pattern generation
const { execSync } = require('child_process');

// Test verses with expected patterns
const testCases = [
  {
    verse: "Eddig Itália földjén termettek csak a könyvek",
    expected: "-UU-UU-----UU--",
    syllables: 15
  },
  {
    verse: "S most Pannónia is ontja a szép dalokat",
    expected: "--UUU-UU-UU-",
    syllables: 13
  },
  {
    verse: "Sokra becsülnek már, a hazám is büszke lehet rám",
    expected: "-UU-U--UU-U-UUU--",
    syllables: 15
  },
  {
    verse: "Szellemem egyre dicsőbb, s általa híres e föld",
    expected: "-UUU-UU--UUU-UU-",
    syllables: 14
  }
];

console.log('Testing Hungarian prosodic patterns:\n');

// We'll need to start the Angular dev server and test via HTTP
// For now, let's build and test manually

testCases.forEach((testCase, i) => {
  console.log(`Test ${i + 1}: "${testCase.verse}"`);
  console.log(`Expected: ${testCase.expected} (${testCase.expected.length} positions, ${testCase.syllables} syllables)`);
  console.log('---');
});

console.log('\nTo test:');
console.log('1. Run: npm start');
console.log('2. Open browser to http://localhost:4200');
console.log('3. Enter each verse line in the text input');
console.log('4. Compare pattern output with expected patterns above');
