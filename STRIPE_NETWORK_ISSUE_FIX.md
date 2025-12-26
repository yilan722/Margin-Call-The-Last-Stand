# 🔧 Stripe 网络连接问题修复指南

## ❌ 问题

错误信息：`js.stripe.com 意外终止了连接`

这表示浏览器无法加载 Stripe Checkout 页面的 JavaScript 资源。

---

## 🔍 原因

1. **网络限制**：Stripe 的 CDN 可能被阻止
2. **防火墙/代理**：阻止了对 Stripe 资源的访问
3. **地理位置**：某些地区可能无法访问 Stripe 服务

---

## ✅ 解决方案

### 方案 1：使用 VPN 或代理（推荐）

如果你在中国大陆或其他受限地区：

1. **启用 VPN**：连接到可以访问 Stripe 的服务器
2. **使用代理**：配置浏览器代理设置
3. **测试连接**：访问 `https://checkout.stripe.com` 确认可以加载

### 方案 2：检查网络设置

1. **检查防火墙**：确保没有阻止 Stripe 域名
2. **检查代理设置**：确保代理配置正确
3. **尝试其他网络**：切换到不同的网络环境

### 方案 3：使用测试模式（如果可用）

如果只是测试，可以：
1. 使用模拟支付模式（不启用 `VITE_USE_REAL_PAYMENT`）
2. 或者部署到可以访问 Stripe 的服务器上测试

---

## 🧪 验证步骤

### 步骤 1：测试 Stripe 连接

在浏览器中直接访问：
```
https://checkout.stripe.com
```

**预期结果**：
- ✅ 可以加载 → 网络正常
- ❌ 无法加载 → 需要 VPN/代理

### 步骤 2：检查 API 是否正常工作

访问：
```
http://localhost:3000/api/test-env
```

应该返回 JSON 响应，显示环境变量状态。

### 步骤 3：测试支付流程

1. 确保网络可以访问 Stripe
2. 打开游戏 → 进入钻石商店
3. 点击购买
4. 应该跳转到 Stripe Checkout 页面

---

## 💡 提示

- **开发环境**：如果无法访问 Stripe，可以使用模拟支付模式
- **生产环境**：确保部署的服务器可以访问 Stripe
- **用户端**：最终用户也需要能够访问 Stripe 才能完成支付

---

## 🔗 相关链接

- [Stripe 支持页面](https://support.stripe.com)
- [Stripe 网络要求](https://stripe.com/docs/network-requirements)

