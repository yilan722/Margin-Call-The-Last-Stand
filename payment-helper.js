// 支付回调辅助脚本 - 在顶层窗口运行，检测支付参数并传递给 iframe
// 这个脚本需要添加到 index.html 中，在 iframe 加载之前运行

(function() {
  // 检查 URL 中是否有支付参数
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');
  const packageId = urlParams.get('package_id');

  if (paymentStatus && sessionId && packageId) {
    console.log('🔍 Payment params detected in top window:', { paymentStatus, sessionId, packageId });
    
    // 等待 iframe 加载完成后发送消息
    function sendPaymentParamsToIframe() {
      // 查找游戏 iframe
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow.postMessage({
            type: 'PAYMENT_PARAMS',
            paymentStatus: paymentStatus,
            sessionId: sessionId,
            packageId: packageId
          }, '*');
          console.log('📤 Sent payment params to iframe:', iframe.src);
        } catch (e) {
          console.log('Cannot send message to iframe:', e);
        }
      });
    }

    // 立即尝试发送（如果 iframe 已加载）
    sendPaymentParamsToIframe();

    // 监听 iframe 加载事件
    window.addEventListener('load', function() {
      setTimeout(sendPaymentParamsToIframe, 1000);
    });

    // 定期尝试发送（直到成功）
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      sendPaymentParamsToIframe();
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);
  }
})();

