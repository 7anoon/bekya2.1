import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  analyzeProduct: async (images, userId, category, originalPrice, title = '', description = '') => {
    // تحليل ذكي بناءً على البيانات الفعلية للمنتج
    // نستخدم العنوان + الوصف + الفئة + السعر لإنشاء تحليل ثابت
    
    const text = (title + ' ' + description).toLowerCase().trim();
    const originalPriceNum = parseInt(originalPrice);
    
    // تحليل الحالة بناءً على الكلمات المفتاحية في العنوان والوصف
    const conditionKeywords = {
      'ممتازة': ['جديد', 'شبه جديد', 'ممتاز', 'زيرو', 'استعمال خفيف', 'نظيف جدا', 'بحالة الجديد', 'لم يستخدم'],
      'جيدة جداً': ['جيد جدا', 'حالة جيدة جدا', 'استعمال بسيط', 'نظيف', 'شبه جديد'],
      'جيدة': ['جيد', 'حالة جيدة', 'استعمال عادي', 'مستعمل', 'نظيف'],
      'متوسطة': ['متوسط', 'حالة متوسطة', 'استعمال كثير', 'به خدوش', 'به عيوب بسيطة'],
      'مقبولة': ['مقبول', 'حالة مقبولة', 'يحتاج صيانة', 'به عيوب', 'قديم', 'متهالك']
    };

    const conditions = {
      'ممتازة': { discount: 0.20, description: 'المنتج في حالة ممتازة، شبه جديد' },
      'جيدة جداً': { discount: 0.35, description: 'المنتج في حالة جيدة جداً مع استخدام خفيف' },
      'جيدة': { discount: 0.50, description: 'المنتج في حالة جيدة مع علامات استخدام واضحة' },
      'متوسطة': { discount: 0.65, description: 'المنتج في حالة متوسطة مع بعض العيوب' },
      'مقبولة': { discount: 0.75, description: 'المنتج في حالة مقبولة مع عيوب واضحة' }
    };

    // البحث عن الحالة بناءً على الكلمات المفتاحية
    let selectedCondition = null;
    for (const [condition, keywords] of Object.entries(conditionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          selectedCondition = { name: condition, ...conditions[condition] };
          break;
        }
      }
      if (selectedCondition) break;
    }

    // إذا لم يتم العثور على كلمات مفتاحية، نستخدم تحليل بناءً على الفئة والسعر
    if (!selectedCondition) {
      // تحليل افتراضي بناءً على الفئة
      const categoryDefaults = {
        'electronics': 'جيدة',      // الإلكترونيات عادة حالتها جيدة
        'furniture': 'جيدة جداً',   // الأثاث يحتفظ بحالته
        'books': 'جيدة',            // الكتب حالتها جيدة
        'clothes': 'متوسطة',        // الملابس تتأثر بالاستخدام
        'toys': 'جيدة',             // الألعاب حالتها جيدة
        'other': 'جيدة'
      };
      
      const defaultCondition = categoryDefaults[category] || 'جيدة';
      selectedCondition = { name: defaultCondition, ...conditions[defaultCondition] };
    }
    
    // حساب السعر بناءً على السعر الأصلي والحالة
    let calculatedPrice = Math.round(originalPriceNum * (1 - selectedCondition.discount));
    
    // تطبيق عوامل إضافية حسب الفئة
    const categoryFactors = {
      'electronics': 0.9,  // الإلكترونيات تفقد قيمتها أسرع
      'furniture': 1.0,    // الأثاث يحتفظ بقيمته
      'books': 0.7,        // الكتب قيمتها أقل
      'clothes': 0.6,      // الملابس تفقد قيمتها بسرعة
      'toys': 0.7,         // الألعاب قيمتها متوسطة
      'other': 0.8
    };
    
    const categoryFactor = categoryFactors[category] || 0.8;
    calculatedPrice = Math.round(calculatedPrice * categoryFactor);
    
    // التأكد من أن السعر لا يتجاوز 500 جنيه (حد بيكيا)
    const suggestedPrice = Math.min(calculatedPrice, 500);
    
    // حساب نسبة التخفيض الفعلية
    const actualDiscount = Math.round(((originalPriceNum - suggestedPrice) / originalPriceNum) * 100);
    
    // تحديد قابلية إعادة التدوير بناءً على الفئة
    const recyclableCategories = {
      'furniture': true,
      'toys': true,
      'other': true,
      'electronics': false,
      'clothes': false,
      'books': false
    };
    
    const canRecycle = recyclableCategories[category] || false;
    
    // تحليل ذكي للأفكار بناءً على العنوان والوصف
    const getSmartRecycleIdea = (category, title, description) => {
      const text = (title + ' ' + description).toLowerCase();
      
      // أفكار مخصصة حسب الكلمات المفتاحية
      const smartIdeas = {
        // أثاث
        'كرسي|chair|seat': 'يمكن تحويله إلى حامل نباتات أو كرسي ديكور بعد إعادة الطلاء',
        'طاولة|table|desk': 'يمكن تحويلها إلى رف حائط أو طاولة جانبية عصرية',
        'دولاب|خزانة|wardrobe|cabinet': 'يمكن تحويله إلى مكتبة كتب أو وحدة تخزين للأدوات',
        'سرير|bed|mattress': 'يمكن استخدام الإطار كقاعدة لأريكة أو صوفا',
        'رف|shelf': 'يمكن إعادة طلائه واستخدامه كديكور حائط أو منظم',
        'مرآة|mirror': 'يمكن تجديد الإطار واستخدامها كقطعة ديكور فنية',
        'سجادة|carpet|rug': 'يمكن قصها واستخدامها كممسحة أو فرش صغير',
        
        // ألعاب
        'دمية|دبدوب|teddy|doll': 'يمكن استخدامها كديكور لغرفة الأطفال أو التبرع بها',
        'لعبة|toy|game': 'يمكن التبرع بها لدور الأيتام أو استخدامها في الحضانات',
        'عربية|سيارة لعبة|car toy': 'يمكن تحويلها إلى قطعة ديكور أو حامل أقلام إبداعي',
        'بازل|puzzle': 'يمكن تأطير القطع وعمل لوحة فنية للحائط',
        
        // كتب
        'كتاب|book|مجلة|magazine': 'يمكن التبرع بها للمكتبات العامة أو استخدام الصفحات في أعمال فنية',
        'قصة|story|رواية|novel': 'يمكن التبرع بها للمدارس أو إنشاء مكتبة مجانية في الحي',
        
        // ملابس
        'قميص|shirt|blouse': 'يمكن تحويله إلى وسادة أو حقيبة قماش',
        'بنطلون|pants|jeans': 'يمكن تحويله إلى حقيبة جينز عصرية أو مفرش',
        'فستان|dress': 'يمكن تحويله إلى ملابس للأطفال أو وسائد ديكور',
        'جاكيت|jacket|معطف|coat': 'يمكن التبرع به أو تحويله إلى بطانية صغيرة',
        
        // إلكترونيات (نادراً)
        'شاحن|charger|كابل|cable': 'يمكن استخدام الأسلاك في مشاريع إلكترونية تعليمية',
        'سماعة|headphone|earphone': 'يمكن استخدام القطع في مشاريع DIY إلكترونية',
        
        // أخرى
        'صندوق|box|علبة': 'يمكن تزيينه واستخدامه كصندوق تخزين أنيق',
        'إطار|frame': 'يمكن إعادة طلائه واستخدامه لصور أو مرايا جديدة',
        'زجاج|glass|برطمان|jar': 'يمكن تحويله إلى مزهرية أو حامل شموع ديكوري',
        'سلة|basket': 'يمكن تزيينها واستخدامها كمنظم للأدوات أو النباتات',
        'وسادة|pillow|cushion': 'يمكن تغيير الغطاء واستخدامها كديكور جديد',
        'ستارة|curtain': 'يمكن تحويلها إلى غطاء طاولة أو وسائد',
        'سجادة|mat': 'يمكن قصها واستخدامها كممسحة أو فرش للحيوانات الأليفة'
      };
      
      // البحث عن تطابق في العنوان والوصف
      for (const [keywords, idea] of Object.entries(smartIdeas)) {
        const patterns = keywords.split('|');
        for (const pattern of patterns) {
          if (text.includes(pattern)) {
            return idea;
          }
        }
      }
      
      // أفكار افتراضية حسب الفئة إذا لم يتم العثور على تطابق
      const defaultIdeas = {
        'furniture': 'يمكن إعادة طلائها وتجديدها لتصبح قطعة ديكور عصرية',
        'toys': 'يمكن التبرع بها لدور الأيتام أو استخدامها في الحضانات',
        'books': 'يمكن التبرع بها للمكتبات العامة أو المدارس',
        'clothes': 'يمكن التبرع بها أو تحويلها إلى قطع قماشية مفيدة',
        'electronics': 'يمكن استخدام القطع في مشاريع تعليمية أو إعادة تدويرها بشكل آمن',
        'other': 'يمكن استخدامها في مشاريع DIY إبداعية أو التبرع بها'
      };
      
      return defaultIdeas[category] || defaultIdeas['other'];
    };
    
    const recycleIdea = canRecycle ? getSmartRecycleIdea(category, title, description) : null;

    return {
      condition: selectedCondition.name,
      canRecycle,
      suggestedPrice,
      originalPrice: originalPriceNum,
      discountPercentage: actualDiscount,
      recycleIdea,
      reasoning: selectedCondition.description
    };
  },

  createProduct: async (productData, images, analysis) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          images,
          condition: analysis.condition,
          original_price: analysis.originalPrice,
          suggested_price: analysis.suggestedPrice,
          discount_percentage: analysis.discountPercentage,
          can_recycle: analysis.canRecycle,
          recycle_idea: analysis.recycleIdea,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`خطأ في حفظ المنتج: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Create product error:', err);
      throw err;
    }
  },

  approveProduct: async (productId, finalPrice) => {
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'approved', 
        final_price: finalPrice,
        approved_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    // إرسال إشعار للبائع
    await supabase.from('notifications').insert({
      user_id: data.user_id,
      product_id: productId,
      message: `تمت الموافقة على منتجك "${data.title}" بسعر ${finalPrice} جنيه`,
      type: 'product_approved'
    });

    // إرسال إشعارات للمستخدمين القريبين
    await get().sendLocationNotifications(data);
    
    return data;
  },

  rejectProduct: async (productId, reason) => {
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    // إرسال إشعار للبائع
    await supabase.from('notifications').insert({
      user_id: data.user_id,
      product_id: productId,
      message: `تم رفض منتجك "${data.title}". السبب: ${reason}`,
      type: 'product_rejected'
    });

    return data;
  },

  // إرسال عرض تفاوض من الـ Admin للبائع
  negotiateProduct: async (productId, negotiatedPrice, note) => {
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'awaiting_seller',
        negotiated_price: negotiatedPrice,
        negotiation_note: note,
        seller_rejected_negotiation: false // مسح علامة الرفض السابقة
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    // إرسال إشعار للبائع
    const noteText = note ? ` - ${note}` : '';
    await supabase.from('notifications').insert({
      user_id: data.user_id,
      product_id: productId,
      message: `عرض سعر جديد لمنتجك "${data.title}": ${negotiatedPrice} جنيه${noteText}`,
      type: 'price_negotiation'
    });

    return data;
  },

  // البائع يوافق على عرض التفاوض
  acceptNegotiation: async (productId) => {
    const { data: product } = await supabase
      .from('products')
      .select('negotiated_price, title, user_id')
      .eq('id', productId)
      .single();

    // تغيير الحالة لـ pending مع وضع السعر النهائي
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'pending',
        final_price: product.negotiated_price,
        negotiation_note: 'البائع وافق - يحتاج موافقة نهائية من الإدارة'
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    // إرسال إشعار للأدمن بأن البائع وافق ويحتاج موافقة نهائية
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        product_id: productId,
        message: `✅ البائع وافق على العرض! المنتج "${product.title}" بسعر ${product.negotiated_price} جنيه - يحتاج موافقتك النهائية للنشر`,
        type: 'offer'
      }));

      await supabase.from('notifications').insert(notifications);
    }
    
    return data;
  },

  // البائع يرفض عرض التفاوض
  rejectNegotiation: async (productId) => {
    // جلب معلومات المنتج والبائع
    const { data: product } = await supabase
      .from('products')
      .select('*, profiles(username, phone)')
      .eq('id', productId)
      .single();

    // تحديث حالة المنتج - يرجع لـ pending مع علامة رفض
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'pending',
        seller_rejected_negotiation: true, // علامة إن البائع رفض
        negotiated_price: null,
        negotiation_note: 'البائع رفض العرض السابق - يحتاج تفاوض جديد'
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    // إرسال إشعار للإدارة برقم التليفون
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        product_id: productId,
        message: `البائع ${product.profiles.username} رفض عرض التفاوض ويحتاج تفاوض جديد. رقم التليفون: ${product.profiles.phone}`,
        type: 'negotiation_rejected'
      }));

      await supabase.from('notifications').insert(notifications);
    }
    
    return data;
  },

  sendLocationNotifications: async (product) => {
    const { data: seller } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', product.user_id)
      .single();

    if (!seller) return;

    const { data: nearbyUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('location', seller.location)
      .neq('id', product.user_id);

    if (nearbyUsers && nearbyUsers.length > 0) {
      const notifications = nearbyUsers.map(user => ({
        user_id: user.id,
        product_id: product.id,
        message: `منتج جديد متاح في منطقتك: ${product.title}`,
        type: 'new_product'
      }));

      await supabase.from('notifications').insert(notifications);
    }
  },

  fetchProducts: async (location = null) => {
    set({ loading: true });
    let query = supabase
      .from('products')
      .select('*, profiles(username, location)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      set({ loading: false });
      throw error;
    }

    set({ products: data || [], loading: false });
    return data;
  },

  fetchUserProducts: async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  fetchPendingProducts: async () => {
    try {
      console.log('fetchPendingProducts: Starting query...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(username, email, phone, location)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('fetchPendingProducts: Query completed', { data, error });

      if (error) {
        console.error('fetchPendingProducts error:', error);
        throw error;
      }
      
      console.log('fetchPendingProducts: Returning data', data);
      return data || [];
    } catch (error) {
      console.error('fetchPendingProducts catch:', error);
      return []; // نرجع array فاضي بدل ما نرمي error
    }
  }
}));
