# Itch.io 支付功能设置指南

## ❌ 问题

Itch.io 是**静态文件托管**，不支持 Serverless Functions（API 路由），所以：
- ❌ `/api/create-checkout-session` 无法在 Itch.io 上运行
- ❌ 支付功能需要后端 API 支持

## ✅ 解决方案

### 方案 1：使用 Vercel 作为 API 后端（推荐）

将 API 路由部署到 Vercel，然后让 Itch.io 上的游戏调用 Vercel 的 API。

#### 步骤 1：部署 API 到 Vercel

1. **确保 Vercel 项目已部署**
   - 访问你的 Vercel 项目：`https://your-project.vercel.app`
   - 确保 API 路由正常工作：`https://your-project.vercel.app/api/test-env`

2. **配置环境变量**
   - 在 Vercel Dashboard 中设置 `STRIPE_SECRET_KEY`
   - 确保使用生产密钥（`sk_live_...`）

#### 步骤 2：修改前端代码指向 Vercel API

修改 `utils/paymentService.ts` 中的 `getApiBaseUrl()` 函数：

```typescript
function getApiBaseUrl(): string {
  // 开发环境使用本地
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // 生产环境：检查是否在 Itch.io 上
  const hostname = window.location.hostname;
  if (hostname.includes('itch.io') || hostname.includes('itch.zone')) {
    // Itch.io 部署：使用 Vercel API
    return 'https://your-project.vercel.app';  // 替换为你的 Vercel 域名
  }
  
  // 其他部署（如 Vercel 本身）：使用当前域名
  return window.location.origin;
}
```

#### 步骤 3：处理 CORS（如果需要）

如果遇到 CORS 错误，需要在 Vercel API 中添加 CORS 头：

修改 `api/create-checkout-session.ts`：

```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 添加 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ... 其余代码
}
```

---

### 方案 2：使用环境变量配置（更灵活）

在构建时通过环境变量指定 API URL。

#### 步骤 1：修改 `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    // ... 其他配置
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://your-project.vercel.app'
      ),
    },
  };
});
```

#### 步骤 2：修改 `utils/paymentService.ts`

```typescript
function getApiBaseUrl(): string {
  // 开发环境
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // 使用环境变量（如果设置了）
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 默认：检查是否在 Itch.io
  const hostname = window.location.hostname;
  if (hostname.includes('itch.io') || hostname.includes('itch.zone')) {
    return 'https://your-project.vercel.app';  // 你的 Vercel 域名
  }
  
  return window.location.origin;
}
```

#### 步骤 3：构建时设置环境变量

```bash
# 为 Itch.io 构建
VITE_API_BASE_URL=https://your-project.vercel.app npm run build
```

---

### 方案 3：禁用支付功能（仅展示游戏）

如果只是展示游戏，可以禁用支付功能。

修改 `App.tsx`，在 Itch.io 上隐藏支付相关 UI：

```typescript
const isItchIO = window.location.hostname.includes('itch.io') || 
                 window.location.hostname.includes('itch.zone');

// 在渲染 DiamondShop 时：
{!isItchIO && showDiamondShop && (
  <DiamondShop ... />
)}
```

---

## 🔧 推荐实现（自动检测）

让我为你实现一个自动检测的方案，无需手动配置。

