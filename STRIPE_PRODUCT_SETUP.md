# Stripe 产品设置说明

## ✅ 当前实现：不需要预先创建产品

你的代码使用的是 **动态定价（`price_data`）**，这意味着：

- ✅ **不需要**在 Stripe Dashboard 中预先创建产品
- ✅ 产品会在创建 Checkout Session 时**自动创建**
- ✅ 每次支付都会动态生成产品和价格

### 当前代码实现

```typescript
// api/create-checkout-session.ts
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price_data: {  // ← 使用动态定价
        currency: 'usd',
        product_data: {
          name: `${totalDiamonds} Time Diamonds`,
          description: `Purchase ${pkg.diamonds} diamonds...`,
        },
        unit_amount: Math.round(pkg.price * 100),
      },
      quantity: 1,
    },
  ],
});
```

---

## 🔄 可选：预先创建产品（更规范）

如果你想在 Stripe Dashboard 中预先创建产品，可以：

### 优点
- ✅ 产品信息统一管理
- ✅ 可以在 Dashboard 中查看所有产品
- ✅ 更符合 Stripe 最佳实践
- ✅ 可以添加产品图片

### 缺点
- ❌ 需要手动创建和维护
- ❌ 价格变更需要更新 Stripe Dashboard

### 如何设置

1. **登录 Stripe Dashboard**
   - 访问 [Stripe Dashboard](https://dashboard.stripe.com)
   - 确保在 **Test mode**（测试模式）或 **Live mode**（生产模式）

2. **创建产品**
   - 进入 **Products** → **Add product**
   - 为每个钻石套餐创建产品：
     - **Starter**: 100 Diamonds - $0.99
     - **Small**: 275 Diamonds (250+25) - $1.99
     - **Medium**: 600 Diamonds (500+100) - $3.99
     - **Large**: 1250 Diamonds (1000+250) - $6.99
     - **XLarge**: 3250 Diamonds (2500+750) - $14.99
     - **Mega**: 7000 Diamonds (5000+2000) - $24.99

3. **获取 Price ID**
   - 创建产品后，Stripe 会自动创建对应的 Price
   - 复制每个 Price 的 ID（格式：`price_xxxxx`）

4. **修改代码使用 Price ID**

   需要修改 `api/create-checkout-session.ts`：

   ```typescript
   // 使用预定义的 Price ID
   const PRICE_IDS: Record<string, string> = {
     starter: 'price_xxxxx',  // 从 Stripe Dashboard 复制
     small: 'price_xxxxx',
     medium: 'price_xxxxx',
     large: 'price_xxxxx',
     xlarge: 'price_xxxxx',
     mega: 'price_xxxxx',
   };

   const session = await stripe.checkout.sessions.create({
     line_items: [
       {
         price: PRICE_IDS[packageId],  // ← 使用 Price ID
         quantity: 1,
       },
     ],
   });
   ```

---

## 📊 两种方式对比

| 特性 | 动态定价（当前） | 预定义产品 |
|------|----------------|-----------|
| **设置复杂度** | ✅ 简单，无需设置 | ❌ 需要手动创建 |
| **灵活性** | ✅ 价格可随时更改 | ❌ 需要更新 Dashboard |
| **管理性** | ❌ 产品分散 | ✅ 统一管理 |
| **最佳实践** | ⚠️ 适合快速开发 | ✅ 适合生产环境 |

---

## 💡 建议

### 开发/测试阶段
- ✅ **使用当前实现**（动态定价）
- 快速迭代，无需维护 Stripe Dashboard

### 生产环境
- ⚠️ **可以考虑**预先创建产品
- 更好的管理和追踪
- 但当前实现也完全可以使用

---

## ✅ 总结

**你不需要在 Stripe Dashboard 中设置任何东西！**

当前实现已经可以正常工作：
- ✅ 只需要 API 密钥（`STRIPE_SECRET_KEY`）
- ✅ 产品会自动创建
- ✅ 可以直接开始测试支付

如果你想更规范地管理产品，可以预先创建，但这不是必需的。

