# AI Chat Converter & Filter (محول ومنسق محادثات الذكاء الاصطناعي)

تطبيق ويب مبني باستخدام **React + Vite + Tailwind CSS** لتحويل وفلترة محادثات ChatGPT و Claude المصدرة من صيغة JSON إلى ملفات نصية منسقة (TXT)، JSON نقي، Markdown، وصفحات HTML جاهزة للطباعة، مع ميزة ذكية لإصلاح تشوه ترميز اللغة العربية (Mojibake).

جاهز تماماً للرفع والنشر المباشر على **Vercel**.

---

## 🌟 المميزات الرئيسية (Features)

1. **معالجة محادثات ChatGPT و Claude**:
   - قراءة مسار المحادثة الفعال (Active Branch) عبر تتبع شجرة العقد (`current_node` و `parent`).
   - استخراج نصوص الرسائل بدقة من مصفوفات `parts` أو كائنات JSON.
   - دعم ملفات `conversations.json` التي تحتوي على محادثات متعددة مع إمكانية التبديل بينها.

2. **إصلاح تشوه الترميز العربي (Mojibake Repair)**:
   - حل تلقائي للمشكلة الشائعة عند فتح أو تصدير ملفات UTF-8 بترميز Windows-1252 أو ISO-8859-1 (مثل تحويل `Ø§Ù„ÙƒÙ„Ø§Ù…` إلى `الكلام`).

3. **خيارات تصفية مرنة**:
   - تصفية رسائل النظام والمطورين (`system` و `tool`).
   - خيار الاقتصار على المسار الفعال أو استخراج كل الرسائل.
   - بحث فوري في محتوى الرسائل.

4. **تصدير متعدد الصيغ**:
   - **ملف نصي (TXT)**: منسق ومرقم مع الفواصل والتواريخ.
   - **JSON نقي**: مصفوفة نظيفة تحتوي على `[{ sender, message, create_time }]`.
   - **Markdown (.md)**: منسق مع أيقونات المستخدم والمساعد وعناوين أنيقة.
   - **صفحة HTML مستقلة**: تصميم تفاعلي أنيق وجاهز للطباعة المباشرة بصيغة PDF.
   - **نسخ بنقرة واحدة (Copy to Clipboard)**.

5. **واجهة مستخدم عصرية وسريعة**:
   - دعم كامل للغتين **العربية (RTL)** و **الإنجليزية (LTR)**.
   - الوضع الليلي والنهاري (Dark / Light Mode).
   - تجربة نموذج محادثة فوري (Demo Chat) بضغطة زر.
   - **أمان وخصوصية 100%**: المعالجة تتم بالكامل داخل متصفح المستخدم دون إرسال أي بيانات لأي خادم خارجي.

---

## 🚀 التشغيل محلياً (Run Locally)

تأكد من وجود Node.js مثبت على جهازك، ثم نفذ:

```bash
# تثبيت الحزم (تم تثبيتها بالفعل)
npm install

# تشغيل خادم التطوير
npm run dev

# بناء المشروع للإنتاج
npm run build
```

---

## 🌐 خطوات الرفع على Vercel (How to Deploy to Vercel)

### الطريقة الأولى: عبر GitHub (الأسهل والموصى بها)

1. أنشئ مستودعاً جديداً (New Repository) على [GitHub](https://github.com/).
2. ارفع هذا المشروع إلى المستودع:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Chat Convert App"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
3. ادخل إلى حسابك في [Vercel](https://vercel.com).
4. اضغط على **"Add New..."** ثم **"Project"**.
5. اختر المستودع الخاص بك واضغط **Import**.
6. سيكتشف Vercel تلقائياً أن المشروع هو **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
7. اضغط **Deploy** وخلال ثوانٍ سيكون موقعك متاحاً برابط مجاني عالمي سريع!

---

### الطريقة الثانية: الرفع المباشر عبر Vercel CLI

إذا كنت تفضل سطر الأوامر:
```bash
# تسجيل الدخول وتثبيت أداة Vercel إذا لم تكن مثبتة
npx vercel

# اتبع التعليمات في سطر الأوامر ووافق على الخيارات الافتراضية
# للنشر النهائي:
npx vercel --prod
```

---

## 📁 هيكلية المشروع (Project Structure)

```
chat convert app/
├── dist/                  # مجلد الإنتاج الجاهز للرفع
├── src/
│   ├── utils/
│   │   ├── chatParser.js  # منطق الفلترة وإصلاح الترميز والتصدير
│   │   └── sampleChat.js  # نموذج محادثة تجريبية
│   ├── App.jsx            # الواجهة التفاعلية الرئيسية
│   ├── main.jsx           # مدخل التطبيق
│   └── index.css          # تنسيقات Tailwind والخطوط
├── public/                # الملفات العامة
├── vercel.json            # إعدادات التوجيه لـ Vercel
├── vite.config.js         # إعدادات Vite
├── tailwind.config.js     # إعدادات Tailwind CSS
├── package.json           # الحزم والتبعيات
└── filter_chat_messages.js # السكريبت الأصلي (محفوظ)
```
