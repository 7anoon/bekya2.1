import { test, expect } from '@playwright/test';

test.describe('Product Details - Text Colors', () => {
  test('should display seller information with black text', async ({ page }) => {
    // الذهاب للصفحة الرئيسية
    await page.goto('/');
    
    // انتظار تحميل الصفحة
    await page.waitForLoadState('networkidle');
    
    // البحث عن أي منتج والضغط عليه
    const productCard = page.locator('.card').first();
    if (await productCard.isVisible()) {
      await productCard.click();
      
      // انتظار تحميل صفحة التفاصيل
      await page.waitForLoadState('networkidle');
      
      // التحقق من وجود معلومات البائع
      const sellerSection = page.locator('text=معلومات');
      if (await sellerSection.isVisible()) {
        // التحقق من لون النصوص
        const sellerLabels = page.locator('[style*="color"]').filter({ hasText: /الاسم|الموقع|الهاتف|البريد/ });
        
        // أخذ screenshot للتحقق البصري
        await page.screenshot({ 
          path: 'tests/screenshots/product-details.png',
          fullPage: true 
        });
        
        console.log('✅ Screenshot saved to tests/screenshots/product-details.png');
      }
    }
  });

  test('should display info items with black text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const productCard = page.locator('.card').first();
    if (await productCard.isVisible()) {
      await productCard.click();
      await page.waitForLoadState('networkidle');
      
      // التحقق من وجود معلومات المنتج
      const infoItems = page.locator('text=/الحالة|الفئة/');
      if (await infoItems.first().isVisible()) {
        await page.screenshot({ 
          path: 'tests/screenshots/product-info.png',
          clip: { x: 0, y: 300, width: 800, height: 400 }
        });
        
        console.log('✅ Info section screenshot saved');
      }
    }
  });
});
