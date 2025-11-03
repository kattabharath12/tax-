#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Railway deployment setup...\n');

let hasErrors = false;

// Check environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AZURE_DOCUMENT_INTELLIGENCE_API_KEY',
  'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT'
];

console.log('📋 Checking environment variables:');
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}`);
  } else {
    console.log(`  ❌ ${varName} - MISSING`);
    hasErrors = true;
  }
});

// Check Prisma schema
console.log('\n📋 Checking Prisma schema:');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('  ✅ Prisma schema exists');
} else {
  console.log('  ❌ Prisma schema not found');
  hasErrors = true;
}

// Check uploads directory
console.log('\n📋 Checking uploads directory:');
const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log(`  ✅ Upload directory writable: ${uploadDir}`);
} catch (error) {
  console.log(`  ❌ Upload directory not writable: ${uploadDir}`);
  hasErrors = true;
}

// Check critical files
console.log('\n📋 Checking critical files:');
const criticalFiles = [
  'package.json',
  'next.config.js',
  'lib/file-storage.ts',
  'railway-migrate.sh'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check for AWS dependencies (should not exist)
console.log('\n📋 Checking for AWS dependencies:');
const packageJson = require('./package.json');
const awsDeps = Object.keys(packageJson.dependencies || {}).filter(dep => dep.includes('aws'));
if (awsDeps.length === 0) {
  console.log('  ✅ No AWS dependencies found');
} else {
  console.log(`  ⚠️  AWS dependencies found: ${awsDeps.join(', ')}`);
}

if (hasErrors) {
  console.log('\n❌ Validation failed! Please fix the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! Ready for deployment.');
  process.exit(0);
}
