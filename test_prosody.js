// Quick test to verify prosody parsing without full test suite

const { TextParserService } = require('./dist/cadentis/app/services/text-parser.service.js');

const testCases = [
  {
    text: 'Eddig Itália földjén termettek csak a könyvek',
    expected: '-UU-UU-----UU--'
  }
];

// Test would run here if we can import the service directly
console.log('Testing Hungarian prosody patterns...');
console.log('First test case:', testCases[0].text);
console.log('Expected pattern:', testCases[0].expected);

console.log('Note: This would require built Angular service to run properly.');
