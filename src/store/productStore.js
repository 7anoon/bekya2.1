import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { log, logError, isAbortError } from '../lib/utils';
import cacheManager, { cacheUtils } from '../lib/cache';

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
      // Validate data
      if (!productData.title || productData.title.trim().length < 3) {
        throw new Error('عنوان المنتج يجب أن يكون 3 أحرف على الأقل');
      }
      if (!productData.description || productData.description.trim().length < 10) {
        throw new Error('وصف المنتج يجب أن يكون 10 أحرف على الأقل');
      }
      if (!images || images.length === 0) {
        throw new Error('يجب إضافة صورة واحدة على الأقل');
      }
      if (analysis.originalPrice > 500) {
        throw new Error('السعر الأصلي يجب ألا يتجاوز 500 جنيه (حد بيكيا)');
      }

      // Timeout handler
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة رفع المنتج. تأكد من اتصالك بالإنترنت')), 30000)
      );

      const uploadPromise = supabase
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

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        console.error('Database error:', error);
        if (error.message.includes('violates foreign key')) {
          throw new Error('خطأ في ربط المنتج بحسابك. حاول تسجيل الدخول مرة أخرى');
        }
        throw new Error(`خطأ في حفظ المنتج: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Create product error:', err);
      throw new Error(err.message || 'حدث خطأ غير متوقع. حاول مرة أخرى');
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

  fetchProducts: async (location = null, page = 1, limit = 20) => {
    set({ loading: true });
    
    try {
      // Check cache first
      const cacheKey = `products_${location || 'all'}_page_${page}`;
      const cachedData = cacheManager.get(cacheKey);
      
      if (cachedData) {
        set({ 
          products: cachedData.data, 
          loading: false,
          totalPages: cachedData.totalPages,
          currentPage: page,
          totalItems: cachedData.count
        });
        return cachedData;
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 20000)
      );
      
      // جلب المنتجات المعتمدة
      let query = supabase
        .from('products')
        .select('*, profiles!products_user_id_fkey(username, location)', { count: 'exact' })
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Add location filter if specified
      if (location) {
        query = query.eq('profiles.location', location);
      }

      const queryPromise = query;
      const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        set({ loading: false });
        throw new Error('خطأ في تحميل المنتجات. تأكد من اتصالك بالإنترنت');
      }

      // جلب معلومات الأدمن مرة واحدة
      const { data: adminData } = await supabase
        .from('profiles')
        .select('username, location, phone, email')
        .eq('role', 'admin')
        .limit(1)
        .single();

      // استبدال معلومات البائع بمعلومات الأدمن للمنتجات المعتمدة
      const productsWithAdminInfo = (data || []).map(product => ({
        ...product,
        profiles: adminData || product.profiles // استخدام معلومات الأدمن بدل البائع
      }));

      const result = { 
        data: productsWithAdminInfo, 
        count, 
        totalPages: Math.ceil(count / limit) 
      };
      
      // Cache the result
      cacheManager.set(cacheKey, result);
      
      set({ 
        products: productsWithAdminInfo, 
        loading: false,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalItems: count
      });
      
      return result;
    } catch (error) {
      set({ loading: false });
      
      if (error.message === 'timeout') {
        console.error('Request timed out:', error);
        throw new Error('انتهت مهلة التحميل. تأكد من اتصالك بالإنترنت وحاول مرة أخرى');
      }
      
      console.error('Error fetching products:', error);
      throw new Error(error.message || 'حدث خطأ في تحميل المنتجات');
    }
  },

  fetchUserProducts: async (userId) => {
    // Check cache first
    const cacheKey = `user_products_${userId}`;
    const cachedData = cacheManager.get(cacheKey);
    
    if (cachedData) {
      // فلترة المنتجات الإلكترونية من الـ cache
      return cachedData.filter(product => product.category !== 'electronics');
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Clear timeout since operation completed
      clearTimeout(timeoutId);

      if (error) throw error;
      
      // فلترة المنتجات الإلكترونية
      const filteredData = data.filter(product => product.category !== 'electronics');
      
      // Cache the result
      cacheManager.set(cacheKey, filteredData, 3 * 60 * 1000); // 3 minutes for user products
      return filteredData;
    } catch (error) {
      // Handle timeout specifically
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.error('Request timed out:', error);
        throw new Error('Request timed out. Please try again.');
      }
      
      console.error('Error fetching user products:', error);
      throw error;
    }
  },

  fetchPendingProducts: async () => {
    try {
      log('fetchPendingProducts: Starting query...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(username, email, phone, location)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      log('fetchPendingProducts: Query completed', { count: data?.length || 0 });

      if (error) {
        logError('fetchPendingProducts error:', error);
        throw error;
      }
      
      // فلترة المنتجات الإلكترونية
      const filteredData = (data || []).filter(product => product.category !== 'electronics');
      
      return filteredData;
    } catch (error) {
      if (isAbortError(error)) {
        log('fetchPendingProducts: Request aborted');
        return [];
      }
      logError('fetchPendingProducts catch:', error);
      return [];
    }
  }
}));
