# 🚀 本地测试快速开始（5分钟）

## 步骤 1：获取测试密钥

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. 确保在 **Test mode**（右上角显示 "Test mode"）
3. 复制 **Secret key**：`sk_test_...`

## 步骤 2：创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 复制示例文件
cp .env.local.example .env.local
```

然后编辑 `.env.local`，填入你的测试密钥：

```env
STRIPE_SECRET_KEY=sk_test_你的测试密钥
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 步骤 3：安装 Vercel CLI（如果还没安装）

```bash
npm install -g vercel
```

或者使用 npx（不需要全局安装）：

```bash
# 不需要安装，直接使用
npx vercel dev
```

## 步骤 4：启动本地服务器

```bash
# 使用 Vercel CLI（推荐，支持 API 路由）
npx vercel dev

# 或者使用 Vite（仅前端，API 需要额外配置）
npm run dev
```

**预期输出**：
```
> Vercel CLI 32.x.x
> Ready! Available at http://localhost:3000
```

## 步骤 5：测试支付

1. 打开浏览器：`http://localhost:3000`
2. 进入游戏 → 打开钻石商店
3. 选择套餐 → 点击购买
4. 使用测试卡号：
   - 卡号：`4242 4242 4242 4242`
   - 过期日期：`12/25`（任意未来日期）
   - CVC：`123`（任意3位数字）
   - 邮编：`12345`（任意5位数字）
5. 完成支付
6. 验证钻石是否增加

## ✅ 完成！

如果以上步骤都成功，说明本地测试通过！🎉

---

## 🐛 遇到问题？

### API 返回 404

**解决方法**：使用 `npx vercel dev` 而不是 `npm run dev`

### 环境变量未加载

**检查**：
1. 确认 `.env.local` 文件在项目根目录
2. 确认变量名正确：`STRIPE_SECRET_KEY`
3. 重启服务器

### 需要帮助？

查看完整指南：`LOCAL_TESTING_GUIDE.md`

