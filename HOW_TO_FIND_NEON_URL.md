# 如何找到 Neon 数据库连接字符串

## 📍 步骤

### 1. 登录 Neon Console
访问 [https://console.neon.tech](https://console.neon.tech) 并登录

### 2. 选择你的项目
在左侧项目列表中，点击你的项目

### 3. 找到连接字符串
在项目页面中，你会看到：

**方式 1：在 Dashboard 首页**
- 找到 "Connection Details" 或 "连接详情" 部分
- 点击 "Show connection string" 或类似按钮
- 复制连接字符串

**方式 2：在 Settings 中**
- 点击左侧菜单的 "Settings" 或 "设置"
- 找到 "Connection string" 或 "连接字符串"
- 复制连接字符串

### 4. 连接字符串格式
应该类似这样：
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 5. 如果找不到密码
- 在 Connection Details 中，点击 "Reset password" 或 "重置密码"
- 设置新密码后，连接字符串会自动更新

---

## 💡 提示

- 连接字符串包含用户名和密码，**不要分享给他人**
- 如果密码泄露，立即重置密码
- 连接字符串可以直接复制使用，不需要手动拼接

