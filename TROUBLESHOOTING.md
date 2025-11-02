# 🔧 راهنمای عیب‌یابی پلتفرم همکاری ایده تا پروژه

## 🚨 مشکلات رایج و راه‌حل‌ها

### 1. خطاهای Build در Docker

#### مشکل: Module not found errors
```
Module not found: Can't resolve '@/contexts/AuthContext'
Module not found: Can't resolve '@/lib/api'
```

**راه‌حل:**
- مطمئن شوید فایل `tsconfig.json` موجود است
- بررسی کنید که path aliases درست تنظیم شده‌اند:
```json
"paths": {
  "@/*": ["./*"]
}
```

#### مشکل: Invalid next.config.js
```
Unrecognized key(s) in object: 'appDir' at "experimental"
```

**راه‌حل:**
- فایل `next.config.js` را به‌روزرسانی کنید
- گزینه `experimental.appDir` را حذف کنید (در Next.js 14 دیگر نیاز نیست)

### 2. مشکلات Database

#### مشکل: Database connection failed
```
psycopg2.OperationalError: could not connect to server
```

**راه‌حل:**
- مطمئن شوید PostgreSQL در حال اجرا است
- بررسی کنید متغیرهای محیطی درست تنظیم شده‌اند
- منتظر بمانید تا database کاملاً آماده شود

#### مشکل: Tables not created
```
relation "users" does not exist
```

**راه‌حل:**
```bash
# اجرای دستی ایجاد جداول
docker-compose exec backend python create_tables.py
```

### 3. مشکلات Frontend

#### مشکل: API calls failing
```
Network Error: axios request failed
```

**راه‌حل:**
- بررسی کنید Backend در حال اجرا است
- متغیر `NEXT_PUBLIC_API_URL` را بررسی کنید
- CORS settings را بررسی کنید

#### مشکل: Authentication not working
```
401 Unauthorized
```

**راه‌حل:**
- Token را در localStorage بررسی کنید
- JWT secret key را بررسی کنید
- Token expiration را بررسی کنید

### 4. مشکلات Docker

#### مشکل: Port already in use
```
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
```

**راه‌حل:**
```bash
# متوقف کردن سرویس‌های در حال اجرا
docker-compose down

# یا تغییر port
# در docker-compose.yml:
# ports:
#   - "3001:3000"  # استفاده از port 3001
```

#### مشکل: Build context issues
```
failed to solve: failed to compute cache key
```

**راه‌حل:**
- مطمئن شوید تمام فایل‌های مورد نیاز در root directory موجود هستند
- `.dockerignore` را بررسی کنید

### 5. مشکلات Performance

#### مشکل: Slow page loading
**راه‌حل:**
- Redis را برای caching فعال کنید
- Database indexes را اضافه کنید
- Image optimization را فعال کنید

#### مشکل: Memory issues
**راه‌حل:**
- Docker memory limits را افزایش دهید
- Database connection pool را تنظیم کنید

## 🛠️ دستورات مفید برای عیب‌یابی

### Docker Commands
```bash
# مشاهده logs
docker-compose logs -f [service_name]

# ورود به container
docker-compose exec backend bash
docker-compose exec frontend sh

# Restart service
docker-compose restart [service_name]

# Rebuild service
docker-compose build [service_name]

# مشاهده status
docker-compose ps

# مشاهده resource usage
docker stats
```

### Database Commands
```bash
# ورود به PostgreSQL
docker-compose exec db psql -U postgres -d idea_project_db

# Backup database
docker-compose exec db pg_dump -U postgres idea_project_db > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres idea_project_db < backup.sql
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Development server
npm run dev

# Lint check
npm run lint
```

### Backend Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run production server
uvicorn main:app --host 0.0.0.0 --port 8000

# Create database tables
python create_tables.py
```

## 🔍 بررسی‌های سیستم

### 1. بررسی سرویس‌ها
```bash
# بررسی status تمام سرویس‌ها
docker-compose ps

# بررسی health checks
docker-compose exec db pg_isready -U postgres
docker-compose exec redis redis-cli ping
```

### 2. بررسی Logs
```bash
# تمام logs
docker-compose logs

# logs مخصوص service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### 3. بررسی Network
```bash
# بررسی connectivity
curl http://localhost:8000/docs
curl http://localhost:3000

# بررسی ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
```

## 📋 Checklist عیب‌یابی

### قبل از شروع:
- [ ] Docker نصب و در حال اجرا است
- [ ] Ports 3000 و 8000 آزاد هستند
- [ ] فایل `.env` موجود و درست تنظیم شده
- [ ] تمام فایل‌های پروژه موجود هستند

### هنگام راه‌اندازی:
- [ ] Database آماده و healthy است
- [ ] Redis آماده و healthy است
- [ ] Backend API در حال اجرا است
- [ ] Frontend build موفق است
- [ ] جداول database ایجاد شده‌اند

### پس از راه‌اندازی:
- [ ] Frontend در http://localhost:3000 قابل دسترسی است
- [ ] Backend API در http://localhost:8000 قابل دسترسی است
- [ ] API Documentation در http://localhost:8000/docs کار می‌کند
- [ ] ثبت‌نام و ورود کار می‌کند
- [ ] تمام صفحات load می‌شوند

## 🆘 درخواست کمک

اگر مشکل شما حل نشد:

1. **Logs را بررسی کنید:**
   ```bash
   docker-compose logs -f
   ```

2. **مشکل را مستند کنید:**
   - Error message کامل
   - Steps برای reproduce کردن مشکل
   - Environment details (OS, Docker version, etc.)

3. **اطلاعات سیستم:**
   ```bash
   docker --version
   docker-compose --version
   node --version
   npm --version
   ```

4. **مشکل را گزارش دهید:**
   - GitHub Issues
   - Email support
   - Community forums

---

**💡 نکته:** همیشه قبل از درخواست کمک، logs را بررسی کنید و مشکل را به‌طور کامل مستند کنید.
