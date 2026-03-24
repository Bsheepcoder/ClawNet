/**
 * 微信消息监听器
 * 
 * 当实例连接微信后，自动监听该实例的微信消息并路由到 ClawNet
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

class WechatListener {
  constructor(config) {
    this.config = config;
    this.gatewayWs = null;
    this.clawnetWs = null;
    this.connectedInstances = new Map();
    this.stats = {
      messagesReceived: 0,
      messagesForwarded: 0,
      startTime: Date.now()
    };
  }
  
  // 启动监听器
  start() {
    console.log('🎧 启动微信消息监听器...');
    
    // 连接到主 Gateway
    this.connectToGateway();
    
    // 连接到 ClawNet
    this.connectToClawNet();
    
    // 加载已连接微信的实例
    this.loadWechatInstances();
    
    console.log('✅ 微信消息监听器已启动');
  }
  
  // 加载已连接微信的实例
  loadWechatInstances() {
    try {
      const instancesPath = '/root/.openclaw/instances.json';
      const instances = JSON.parse(fs.readFileSync(instancesPath, 'utf8'));
      
      for (const [id, instance] of Object.entries(instances)) {
        if (instance.wechat?.loggedIn) {
          this.connectedInstances.set(id, {
            nodeId: `openclaw-${id}`,
            wechat: instance.wechat
          });
          console.log(`📱 发现已连接微信的实例: ${id}`);
        }
      }
      
      console.log(`📊 共发现 ${this.connectedInstances.size} 个微信实例`);
    } catch (error) {
      console.error('加载实例失败:', error.message);
    }
  }
  
  // 连接到主 Gateway
  connectToGateway() {
    const gatewayUrl = this.config.gatewayUrl || 'ws://localhost:18789';
    console.log(`🔌 连接到 OpenClaw Gateway: ${gatewayUrl}`);
    
    this.gatewayWs = new WebSocket(`${gatewayUrl}/ws?token=clawnet-wechat-listener-${Date.now()}`);
    
    this.gatewayWs.on('open', () => {
      console.log('✅ 已连接到 OpenClaw Gateway');
      
      // 订阅所有消息
      this.gatewayWs.send(JSON.stringify({
        type: 'subscribe',
        topics: ['message', 'wechat', 'wechat.message']
      }));
      
      // 定期心跳
      setInterval(() => {
        if (this.gatewayWs?.readyState === WebSocket.OPEN) {
          this.gatewayWs.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    });
    
    this.gatewayWs.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleGatewayMessage(message);
      } catch (error) {
        // 忽略非 JSON 消息
      }
    });
    
    this.gatewayWs.on('error', (error) => {
      console.error('Gateway 错误:', error.message);
    });
    
    this.gatewayWs.on('close', () => {
      console.log('Gateway 断开，5秒后重连...');
      setTimeout(() => this.connectToGateway(), 5000);
    });
  }
  
  // 连接到 ClawNet
  connectToClawNet() {
    const clawnetUrl = this.config.clawnetUrl || 'ws://localhost:3000';
    const token = this.config.clawnetToken || 'clawnet-secret-token';
    
    console.log(`🔌 连接到 ClawNet: ${clawnetUrl}`);
    
    this.clawnetWs = new WebSocket(`${clawnetUrl}?nodeId=clawnet-wechat-listener&token=${token}`);
    
    this.clawnetWs.on('open', () => {
      console.log('✅ 已连接到 ClawNet');
    });
    
    this.clawnetWs.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        // 收到 ClawNet 的回复消息，可以发送回微信
        if (message.type === 'message' && message.from !== 'clawnet-wechat-listener') {
          this.sendToWechat(message);
        }
      } catch (error) {
        // 忽略
      }
    });
    
    this.clawnetWs.on('error', (error) => {
      console.error('ClawNet 错误:', error.message);
    });
    
    this.clawnetWs.on('close', () => {
      console.log('ClawNet 断开，5秒后重连...');
      setTimeout(() => this.connectToClawNet(), 5000);
    });
  }
  
  // 处理 Gateway 消息
  handleGatewayMessage(message) {
    // 检查是否是微信消息
    if (this.isWechatMessage(message)) {
      console.log('📨 收到微信消息:', message.type);
      this.stats.messagesReceived++;
      
      // 确定消息来自哪个实例
      const instanceId = this.detectInstance(message);
      if (instanceId) {
        console.log(`   来自实例: ${instanceId}`);
        this.forwardToClawNet(message, instanceId);
      } else {
        console.log('   无法确定来源实例，使用默认实例');
        this.forwardToClawNet(message, 'qxd');
      }
    }
  }
  
  // 判断是否是微信消息
  isWechatMessage(message) {
    return (
      message.type === 'wechat' ||
      message.type === 'wechat.message' ||
      message.source === 'wechat' ||
      message.platform === 'wechat' ||
      (message.from && message.from.includes('wechat')) ||
      (message.payload && message.payload.source === 'wechat')
    );
  }
  
  // 检测消息来自哪个实例
  detectInstance(message) {
    // 从消息中提取实例信息
    for (const [id, instance] of this.connectedInstances) {
      if (message.instanceId === id || 
          message.instance === id ||
          message.from?.includes(instance.wechat.accountId)) {
        return id;
      }
    }
    
    // 默认返回第一个微信实例
    return this.connectedInstances.keys().next().value || 'qxd';
  }
  
  // 转发到 ClawNet
  forwardToClawNet(message, instanceId) {
    const nodeId = `openclaw-${instanceId}`;
    
    const payload = {
      from: nodeId,
      type: 'wechat-message',
      payload: {
        text: message.text || message.content || message.payload?.text,
        fromUser: message.from || message.sender || message.userId || message.payload?.fromUser,
        toUser: message.to || message.recipient || message.target,
        timestamp: message.timestamp || Date.now(),
        originalMessage: message
      }
    };
    
    console.log(`  转发消息到 ClawNet: ${nodeId}`);
    console.log(`  内容: ${payload.payload.text?.substring(0, 50)}...`);
    
    // 通过 HTTP API 路由
    this.routeViaHttp(payload);
    
    // 也通过 WebSocket 发送
    if (this.clawnetWs?.readyState === WebSocket.OPEN) {
      this.clawnetWs.send(JSON.stringify({
        type: 'message',
        ...payload
      }));
    }
    
    this.stats.messagesForwarded++;
  }
  
  // 通过 HTTP API 路由
  routeViaHttp(payload) {
    const postData = JSON.stringify(payload);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/route',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.clawnetToken || 'clawnet-secret-token'}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log(`  ✅ 已路由到: ${result.data.targets?.join(', ')}`);
          }
        } catch (e) {}
      });
    });
    
    req.on('error', (error) => {
      console.error('  ❌ 路由失败:', error.message);
    });
    
    req.write(postData);
    req.end();
  }
  
  // 发送消息回微信
  sendToWechat(message) {
    if (this.gatewayWs?.readyState === WebSocket.OPEN) {
      this.gatewayWs.send(JSON.stringify({
        type: 'wechat.send',
        payload: message.payload
      }));
      console.log('📤 发送回复到微信');
    }
  }
  
  // 获取状态
  getStatus() {
    return {
      gatewayConnected: this.gatewayWs?.readyState === WebSocket.OPEN,
      clawnetConnected: this.clawnetWs?.readyState === WebSocket.OPEN,
      instances: Array.from(this.connectedInstances.keys()),
      stats: this.stats
    };
  }
  
  // 停止
  stop() {
    if (this.gatewayWs) this.gatewayWs.close();
    if (this.clawnetWs) this.clawnetWs.close();
  }
}

module.exports = WechatListener;

// 如果直接运行
if (require.main === module) {
  const listener = new WechatListener({
    gatewayUrl: 'ws://localhost:18789',
    clawnetUrl: 'ws://localhost:3000',
    clawnetToken: 'clawnet-secret-token'
  });
  
  listener.start();
  
  // 处理退出
  process.on('SIGINT', () => {
    console.log('\n停止监听器...');
    listener.stop();
    process.exit(0);
  });
}
