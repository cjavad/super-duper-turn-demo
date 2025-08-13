// Simple script to verify the structure of the Svelte frontend
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define expected files
const expectedFiles = [
  'index.html',
  'package.json',
  'vite.config.js',
  'src/main.js',
  'src/App.svelte',
  'src/components/ConnectionStatus.svelte',
  'src/components/TextChat.svelte',
  'src/components/VideoChat.svelte',
  'src/styles/index.css'
];

// Define expected imports in App.svelte
const expectedImports = [
  'svelte',
  'simple-peer',
  'socket.io-client',
  './components/VideoChat.svelte',
  './components/TextChat.svelte',
  './components/ConnectionStatus.svelte'
];

// Check if all expected files exist
console.log('Checking for expected files...');
let allFilesExist = true;
for (const file of expectedFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} does not exist`);
    allFilesExist = false;
  }
}

// Check App.svelte for expected imports
console.log('\nChecking App.svelte for expected imports...');
const appSveltePath = path.join(__dirname, 'src/App.svelte');
if (fs.existsSync(appSveltePath)) {
  const appSvelteContent = fs.readFileSync(appSveltePath, 'utf8');
  let allImportsPresent = true;
  
  for (const importItem of expectedImports) {
    if (appSvelteContent.includes(`import`) && appSvelteContent.includes(importItem)) {
      console.log(`✓ Import of ${importItem} found`);
    } else {
      console.log(`✗ Import of ${importItem} not found`);
      allImportsPresent = false;
    }
  }
  
  if (allImportsPresent) {
    console.log('\n✓ All expected imports are present in App.svelte');
  } else {
    console.log('\n✗ Some expected imports are missing in App.svelte');
  }
} else {
  console.log('✗ Cannot check imports because App.svelte does not exist');
}

// Final result
console.log('\nTest Results:');
if (allFilesExist) {
  console.log('✓ All expected files exist');
} else {
  console.log('✗ Some expected files are missing');
}

console.log('\nNote: This is a basic structure test. A full test would require running the application.');
console.log('The Svelte frontend should be manually tested in a browser environment.');