# 本地测试支付功能完整指南

## 🎯 本地测试的优势

- ✅ 使用 Stripe 测试密钥，不会产生真实费用
- ✅ 使用测试卡号，安全测试
- ✅ 快速迭代，无需部署
- ✅ 调试方便，可以看到详细日志

---

## 📋 准备工作

### 1. 获取 Stripe 测试密钥

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 确保在 **Test mode**（测试模式）
3. 进入 **Developers** → **API keys**
4. 复制 **Secret key**：`sk_test_...`

### 2. 安装 Vercel CLI（用于运行本地 API）

```bash
npm install -g vercel
```

或者使用 npx（不需要全局安装）：

```bash
npx vercel dev
```

---

## 🚀 本地测试步骤

### 步骤 1：创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```env
# Stripe 测试密钥（从 Stripe Dashboard 获取）
STRIPE_SECRET_KEY=sk_test_...

# 本地开发服务器地址
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ 重要**：
- 使用测试密钥（`sk_test_...`），不是生产密钥
- 确保 `.env.local` 在 `.gitignore` 中（已添加）

### 步骤 2：安装依赖

```bash
npm install
```

### 步骤 3：启动本地开发服务器

#### 选项 A：使用 Vercel CLI（推荐，支持 Serverless Functions）

```bash
# 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 启动本地开发服务器
vercel dev
```

或者使用 npx：

```bash
npx vercel dev
```

**预期输出**：
```
> Vercel CLI 32.x.x
> Ready! Available at http://localhost:3000
```

#### 选项 B：使用 Vite（仅前端，API 需要单独配置）

```bash
npm run dev
```

**注意**：如果使用 Vite，API 路由不会自动工作，需要额外配置。

### 步骤 4：测试 API 端点

打开浏览器，访问：

```
http://localhost:3000/api/create-checkout-session
```

**预期结果**：
- 返回 `{"error":"Method not allowed"}` → ✅ API 正常工作
- 返回 404 → ❌ 需要检查配置

### 步骤 5：在游戏中测试

1. 打开浏览器访问：`http://localhost:3000`
2. 进入游戏，打开钻石商店
3. 选择套餐并点击购买
4. 应该跳转到 Stripe Checkout（测试模式）

### 步骤 6：使用测试卡号完成支付

在 Stripe Checkout 页面使用以下测试卡号：

**成功支付**：
- 卡号：`4242 4242 4242 4242`
- 过期日期：任意未来日期（如 `12/25`）
- CVC：任意3位数字（如 `123`）
- 邮编：任意5位数字（如 `12345`）

**其他测试卡号**：
- 需要 3D Secure：`4000 0025 0000 3155`
- 支付失败：`4000 0000 0000 0002`
- 需要授权：`4000 0027 6000 3184`

### 步骤 7：验证结果

1. ✅ 支付成功后返回网站
2. ✅ 显示成功消息
3. ✅ 钻石数量增加
4. ✅ 刷新页面后钻石数量保持不变

---

## 🔧 配置说明

### .env.local 文件格式

```env
# Stripe 测试密钥（从 Stripe Dashboard 获取）
STRIPE_SECRET_KEY=sk_test_你的测试密钥（从 Stripe Dashboard 获取）

# 本地开发服务器地址
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 使用 Vercel CLI 的优势

- ✅ 自动识别 `/api` 目录中的 Serverless Functions
- ✅ 自动加载 `.env.local` 中的环境变量
- ✅ 模拟 Vercel 生产环境
- ✅ 支持热重载

---

## 🧪 测试检查清单

### 功能测试

- [ ] 环境变量文件已创建（`.env.local`）
- [ ] 使用测试密钥（`sk_test_...`）
- [ ] 本地服务器成功启动
- [ ] API 端点可访问
- [ ] 钻石商店可以打开
- [ ] 点击购买后跳转到 Stripe Checkout
- [ ] 使用测试卡号完成支付
- [ ] 支付成功后返回网站
- [ ] 钻石数量正确增加

### 技术测试

- [ ] 浏览器 Console 没有错误
- [ ] 网络请求成功（F12 → Network）
- [ ] API 返回正确的响应
- [ ] 支付验证正常工作

---

## 🐛 常见问题

### 问题 1：`vercel` 命令未找到

**解决方法**：
```bash
# 使用 npx（推荐）
npx vercel dev

# 或全局安装
npm install -g vercel
```

### 问题 2：API 返回 404

**可能原因**：
- 没有使用 `vercel dev`，而是使用了 `npm run dev`
- API 文件路径不正确

**解决方法**：
- 使用 `vercel dev` 启动服务器
- 确认 `/api` 目录在项目根目录

### 问题 3：环境变量未加载

**检查**：
1. 确认 `.env.local` 文件在项目根目录
2. 确认变量名正确（`STRIPE_SECRET_KEY`）
3. 重启开发服务器

**解决方法**：
```bash
# 停止服务器（Ctrl+C）
# 重新启动
vercel dev
```

### 问题 4：Stripe Checkout 显示错误

**检查**：
1. 确认使用的是测试密钥（`sk_test_...`）
2. 确认密钥正确（没有多余空格）
3. 查看终端中的错误日志

---

## 📊 测试记录

建议记录测试结果：

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 环境变量加载 | ✅/❌ | |
| API 端点可访问 | ✅/❌ | |
| 创建支付会话 | ✅/❌ | |
| Stripe Checkout 显示 | ✅/❌ | |
| 测试支付成功 | ✅/❌ | |
| 钻石正确添加 | ✅/❌ | |

---

## 🎯 快速测试命令

```bash
# 1. 创建 .env.local 文件（手动创建，添加测试密钥）

# 2. 安装依赖（如果还没安装）
npm install

# 3. 启动本地服务器
npx vercel dev

# 4. 打开浏览器
# http://localhost:3000
```

---

## ✅ 测试成功后

本地测试成功后，你可以：

1. ✅ 确认支付流程正常
2. ✅ 确认代码没有错误
3. ✅ 安全地部署到生产环境
4. ✅ 使用生产密钥进行真实测试

---

## 📚 参考资源

- [Stripe 测试卡号](https://stripe.com/docs/testing)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)

祝测试顺利！🚀

