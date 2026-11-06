# Bug Tracker

نظام لتتبع الأخطاء مبني بـ HTML / CSS / JavaScript / PHP / MySQL.

## الأدوار
- **Manager:** كل الصلاحيات (إنشاء وحذف المشاريع، إدارة الأعضاء، حذف البقات)
- **Tester:** تسجيل البقات وتغيير الحالة والتعليق
- **Developer:** تغيير الحالة والتعليق وعرض السجل

## المميزات
- مشاريع وأعضاء وبقات
- سجل تغييرات (History) وتعليقات مع منشن
- إشعارات ودائرة غير مقروء
- لوحة مؤشرات مع فلترة بالفترة
- فلاتر على جدول البقات

## التشغيل
1. ثبّتي MAMP وMySQL، وضعي المجلد داخل `htdocs`.
2. أنشئي القاعدة:
   `CREATE DATABASE bugtracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. استوردي الهيكل من `database.sql`.
4. انسخي `api/config.example.php` إلى `api/config.php` وعبّي بيانات الاتصال.
5. أنشئي حساب مانجر:
   - ولّدي هاش: `php -r "echo password_hash('كلمتك', PASSWORD_DEFAULT);"`
   - `INSERT INTO users (email, password_hash, role) VALUES ('manager@example.com', 'الهاش', 'manager');`
6. افتحي: `http://localhost/coop_project/login.html`