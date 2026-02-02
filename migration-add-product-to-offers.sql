-- إضافة عمود product_id لجدول offers
ALTER TABLE offers 
ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- إنشاء index للأداء
CREATE INDEX idx_offers_product ON offers(product_id);

-- تحديث السياسة للسماح بعرض العروض المرتبطة بمنتج معين
COMMENT ON COLUMN offers.product_id IS 'المنتج المستهدف للعرض - null يعني كل المنتجات';
