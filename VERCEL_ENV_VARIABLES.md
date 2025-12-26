# Vercel 环境变量配置完整指南

## 📋 当前项目需要的环境变量

### ✅ 必需的环境变量

#### 1. STRIPE_SECRET_KEY（后端使用）

**变量名**: `STRIPE_SECRET_KEY`

**值**: 
```
sk_live_你的生产密钥（从 Stripe Dashboard 获取）
```

**环境**: Production ✅

**说明**: 这是后端 API 使用的密钥，用于创建和验证支付会话。

---

### ❓ 可选的环境变量

#### 2. STRIPE_PUBLISHABLE_KEY（前端使用，当前不需要）

**重要**: 当前实现**不需要** Publishable Key！

我们使用的是 **Stripe Checkout**，所有支付处理都在后端完成，前端不需要直接调用 Stripe API。

**如果将来需要使用 Stripe Elements 或其他前端功能，格式如下**:

**变量名**: `VITE_STRIPE_PUBLISHABLE_KEY`

**值**: 
```
pk_live_你的发布密钥（从 Stripe Dashboard 获取）
```

**环境**: Production ✅

**说明**: 
- 使用 `VITE_` 前缀是因为项目使用 Vite 构建工具
- 只有以 `VITE_` 开头的环境变量才会暴露到前端代码
- 这个密钥可以安全地暴露在前端（这就是为什么叫 "Publishable"）

---

#### 3. NEXT_PUBLIC_BASE_URL（可选，但推荐）

**变量名**: `NEXT_PUBLIC_BASE_URL`

**值**: 
```
https://your-domain.vercel.app
```

**环境**: Production ✅

**说明**: 你的网站域名，用于支付成功后的重定向。

---

## 🔧 在 Vercel 中配置的步骤

### 步骤 1：进入环境变量设置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**

### 步骤 2：添加环境变量

点击 **"Add New"** 按钮，逐个添加：

#### 变量 1：STRIPE_SECRET_KEY

```
Key: STRIPE_SECRET_KEY
Value: sk_live_你的生产密钥（从 Stripe Dashboard 获取）
Environment: Production ✅
```

点击 **Save**

#### 变量 2：NEXT_PUBLIC_BASE_URL（推荐）

```
Key: NEXT_PUBLIC_BASE_URL
Value: https://your-actual-domain.vercel.app
Environment: Production ✅
```

点击 **Save**

---

## 📝 环境变量命名规则

### Vite 项目（你的项目）

- **后端变量**（不暴露到前端）:
  - `STRIPE_SECRET_KEY` ✅
  - `DATABASE_URL` ✅
  - `API_KEY` ✅
  - 等等...

- **前端变量**（暴露到前端，需要 `VITE_` 前缀）:
  - `VITE_STRIPE_PUBLISHABLE_KEY` ✅
  - `VITE_API_BASE_URL` ✅
  - 等等...

### 重要提示

1. **只有 `VITE_` 开头的变量才会暴露到前端**
2. **Secret Key 永远不要加 `VITE_` 前缀**
3. **Publishable Key 可以加 `VITE_` 前缀（如果将来需要）**

---

## ✅ 当前项目配置总结

### 必需配置（生产环境）

| 变量名 | 值 | 环境 | 说明 |
|--------|-----|------|------|
| `STRIPE_SECRET_KEY` | `sk_live_你的生产密钥` | Production | 后端 API 密钥 |

### 可选配置

| 变量名 | 值 | 环境 | 说明 |
|--------|-----|------|------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.vercel.app` | Production | 网站域名 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_你的发布密钥` | Production | 前端密钥（当前不需要） |

---

## 🎯 快速配置

**最小配置（必需）**:

```
STRIPE_SECRET_KEY = sk_live_你的生产密钥（从 Stripe Dashboard 获取）
Environment: Production
```

**推荐配置（包含域名）**:

```
STRIPE_SECRET_KEY = sk_live_你的生产密钥（从 Stripe Dashboard 获取）
NEXT_PUBLIC_BASE_URL = https://your-domain.vercel.app
Environment: Production
```

---

## ⚠️ 重要提醒

1. **Publishable Key 当前不需要**
   - 你的实现使用 Stripe Checkout
   - 所有支付处理在后端完成
   - 不需要在前端使用 Publishable Key

2. **如果将来需要 Publishable Key**
   - 变量名必须是 `VITE_STRIPE_PUBLISHABLE_KEY`
   - 值：`pk_live_你的发布密钥（从 Stripe Dashboard 获取）`

3. **Secret Key 格式**
   - 变量名：`STRIPE_SECRET_KEY`（不要加 `VITE_`）
   - 值：`sk_live_...` 或 `sk_test_...`

---

## 🔍 验证配置

部署后，检查：

1. ✅ 环境变量已设置
2. ✅ 使用 Production 环境
3. ✅ 变量名正确（大小写敏感）
4. ✅ 值完整（没有多余空格）
5. ✅ 已重新部署

完成！🎉

