import { test, expect } from '@playwright/test';
import fs from 'fs';

test('verify ProductDetails styles have black text colors', async () => {
  // قراءة ملف ProductDetails
  const fileContent = fs.readFileSync('src/pages/ProductDetails.jsx', 'utf-8');
  
  // التحقق من الألوان السوداء
  const checks = [
    { name: 'sellerLabel color', pattern: /sellerLabel:[\s\S]*?color:\s*['"]#000000['"]/ },
    { name: 'sellerValue color', pattern: /sellerValue:[\s\S]*?color:\s*['"]#000000['"]/ },
    { name: 'infoLabel color', pattern: /infoLabel:[\s\S]*?color:\s*['"]#000000['"]/ },
    { name: 'infoValue color', pattern: /infoValue:[\s\S]*?color:\s*['"]#000000['"]/ },
    { name: 'priceLabel color', pattern: /priceLabel:[\s\S]*?color:\s*['"]#000000['"]/ },
    { name: 'description color', pattern: /description:[\s\S]*?color:\s*['"]#000000['"]/ },
    { name: 'sectionTitle color', pattern: /sectionTitle:[\s\S]*?color:\s*['"]#000000['"]/ },
  ];
  
  console.log('\n🔍 Verifying text colors in ProductDetails.jsx:\n');
  
  let allPassed = true;
  for (const check of checks) {
    const found = check.pattern.test(fileContent);
    const status = found ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${found ? 'BLACK (#000000)' : 'NOT BLACK'}`);
    
    if (!found) {
      allPassed = false;
    }
    
    expect(found, `${check.name} should be black (#000000)`).toBe(true);
  }
  
  // التحقق من الخلفيات
  console.log('\n🎨 Verifying backgrounds:\n');
  
  const bgChecks = [
    { name: 'sellerItem background', pattern: /sellerItem:[\s\S]*?background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.8\)['"]/ },
    { name: 'sellerSection background', pattern: /sellerSection:[\s\S]*?background:\s*['"]rgba\(107,\s*124,\s*89,\s*0\.15\)['"]/ },
  ];
  
  for (const check of bgChecks) {
    const found = check.pattern.test(fileContent);
    const status = found ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${found ? 'CORRECT' : 'INCORRECT'}`);
    
    if (!found) {
      allPassed = false;
    }
    
    expect(found, `${check.name} should have correct background`).toBe(true);
  }
  
  if (allPassed) {
    console.log('\n✅ All styles are correctly applied!\n');
  } else {
    console.log('\n❌ Some styles are missing or incorrect!\n');
  }
});
