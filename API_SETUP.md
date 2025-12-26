# 真实历史数据API配置

## Alpha Vantage API 设置

游戏现在支持使用真实历史股票数据。要启用此功能，需要配置 Alpha Vantage API Key。

### 获取 API Key

1. 访问 [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. 注册免费账号
3. 获取你的 API Key（免费版每天有500次请求限制）

### 配置 API Key

在项目根目录创建 `.env.local` 文件：

```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### 注意事项

- **免费版限制**：Alpha Vantage 免费版每天限制500次API调用
- **Fallback机制**：如果API调用失败或达到限制，游戏会自动使用模拟数据
- **数据延迟**：免费版API可能有15分钟的数据延迟
- **无需API也可运行**：如果不配置API Key，游戏会使用高质量的模拟数据

### 支持的股票代码

游戏中使用的主要股票代码：
- `SPY` - S&P 500 ETF
- `MSFT` - Microsoft
- `QQQ` - Nasdaq ETF
- `NVDA` - NVIDIA
- `GME` - GameStop
- `BTC` - Bitcoin (使用模拟数据，Alpha Vantage不支持加密货币)

### 数据获取逻辑

1. 每个关卡分为4个阶段（Phase 1-4）
2. 每个阶段会尝试获取对应时间段的历史数据
3. 如果API不可用，使用基于真实事件特征的模拟数据
4. 模拟数据会根据阶段随机化趋势，避免可预测性


