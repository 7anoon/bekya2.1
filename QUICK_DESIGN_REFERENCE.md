# ⚡ مرجع سريع للتصميم

## 🎨 الألوان (Copy & Paste)

```css
/* Primary */
--primary: #6b7c59;
--primary-dark: #556b2f;

/* Secondary */
--secondary: #8b7355;
--secondary-dark: #6d5a42;

/* Background */
--bg: #f5f5f0;
--bg-white: #ffffff;

/* Text */
--text: #2d2d2d;
--text-secondary: #7a7a7a;
--text-light: #999;
```

---

## 📐 المقاسات

```css
/* Border Radius */
--radius-xl: 28px;  /* Cards */
--radius-lg: 24px;
--radius-md: 20px;  /* Buttons */
--radius-sm: 16px;  /* Inputs */

/* Spacing */
--space-sm: 16px;
--space-md: 24px;
--space-lg: 32px;
--space-xl: 48px;

/* Font Sizes */
--text-sm: 14px;
--text-base: 15px;
--text-lg: 17px;
--text-xl: 20px;
--text-2xl: 28px;
--text-3xl: 32px;
--text-4xl: 42px;
```

---

## 🧩 Components

### Button
```jsx
<button className="btn btn-primary">
  النص
</button>
```
```css
.btn-primary {
  background: #6b7c59;
  color: white;
  padding: 14px 28px;
  border-radius: 20px;
  font-weight: 500;
}
```

### Card
```jsx
<div className="card" style={styles.card}>
  المحتوى
</div>
```
```css
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 28px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(107, 124, 89, 0.1);
}
```

### Input
```jsx
<input className="input" />
```
```css
.input {
  padding: 14px 16px;
  border: 1px solid rgba(107, 124, 89, 0.2);
  border-radius: 16px;
  background: white;
}
```

---

## 🎯 Inline Styles

### Info Box
```jsx
style={{
  padding: '20px',
  background: 'rgba(107, 124, 89, 0.04)',
  borderRadius: '20px',
  border: '1px solid rgba(107, 124, 89, 0.08)'
}}
```

### Price Display
```jsx
style={{
  fontSize: '24px',
  fontWeight: '600',
  color: '#6b7c59'
}}
```

### Badge
```jsx
style={{
  background: '#8b7355',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '24px',
  fontSize: '15px',
  fontWeight: '600'
}}
```

---

## ✨ Effects

### Hover
```css
transition: all 0.3s ease;
```
```css
/* On hover */
transform: translateY(-2px);
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
```

### Glass Effect
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);
```

---

## 📱 Responsive

```css
@media (max-width: 768px) {
  /* Tablet */
}

@media (max-width: 480px) {
  /* Mobile */
}
```

---

## 🚀 Quick Tips

1. **Cards**: دايماً استخدم `border-radius: 28px`
2. **Buttons**: دايماً استخدم `border-radius: 20px`
3. **Spacing**: استخدم مضاعفات 4 (16, 24, 32, 48)
4. **Colors**: التزم بالـ palette المحدد
5. **Transitions**: دايماً `0.3s ease`

---

## ❌ Don't

- ❌ استخدام ألوان خارج الـ palette
- ❌ Border radius أقل من 16px
- ❌ Padding غير منتظم
- ❌ ألوان صارخة

## ✅ Do

- ✅ استخدام الألوان المحددة
- ✅ Spacing منتظم
- ✅ Border radius كبير
- ✅ Transitions ناعمة
- ✅ Glass effects

---

تم إنشاؤه بواسطة Kiro 🤖
