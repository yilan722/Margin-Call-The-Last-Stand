# Vercel 环境变量 - 直接复制粘贴

## 📋 在 Vercel Dashboard 中添加以下环境变量

### 1. NEON_DATABASE_URL

**变量名：**
```
NEON_DATABASE_URL
```

**变量值：**
```
postgresql://neondb_owner:你的实际密码@ep-autumn-wave-a4yrv9k6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

⚠️ **注意**：将 `你的实际密码` 替换为 Neon 数据库的真实密码（不是 `****************`）

---

### 2. STRIPE_WEBHOOK_SECRET

**变量名：**
```
STRIPE_WEBHOOK_SECRET
```

**变量值：**
```
whsec_sUSGVbtR0FTLrfUkb2w8B8N1XM9E0XCq
```

---

### 3. STRIPE_SECRET_KEY（如果还没有）

**变量名：**
```
STRIPE_SECRET_KEY
```

**变量值：**
```
你的Stripe Secret Key（sk_live_... 或 sk_test_...）
```

---

## 🔧 在 Vercel 中添加步骤

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `margin-call-the-last-stand`
3. 进入 **Settings** → **Environment Variables**
4. 点击 **Add New**
5. 分别添加上述三个变量
6. 确保选择 **Production**、**Preview**、**Development** 三个环境
7. 点击 **Save**

---

## ✅ 添加完成后

1. 重新部署项目（Vercel 会自动检测环境变量变化并重新部署）
2. 或者手动触发部署：进入 **Deployments** → 点击最新部署的 **...** → **Redeploy**

