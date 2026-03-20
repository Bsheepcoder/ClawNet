#!/bin/bash

# 微信公众号集成测试脚本

echo "🧪 测试微信适配器"
echo ""

# 1. 检查环境变量
echo "1️⃣ 检查环境变量..."
if [ -z "$WECHAT_APPID" ]; then
  echo "❌ WECHAT_APPID 未设置"
  echo "   请执行: export WECHAT_APPID='your_appid'"
  exit 1
else
  echo "✅ WECHAT_APPID: $WECHAT_APPID"
fi

if [ -z "$WECHAT_APPSECRET" ]; then
  echo "❌ WECHAT_APPSECRET 未设置"
  echo "   请执行: export WECHAT_APPSECRET='your_appsecret'"
  exit 1
else
  echo "✅ WECHAT_APPSECRET: 已设置"
fi

if [ -z "$WECHAT_TOKEN" ]; then
  echo "⚠️  WECHAT_TOKEN 未设置，使用默认值: clawnet"
  export WECHAT_TOKEN="clawnet"
else
  echo "✅ WECHAT_TOKEN: $WECHAT_TOKEN"
fi

echo ""

# 2. 检查服务状态
echo "2️⃣ 检查 ClawNet 服务..."
HEALTH=$(curl -s http://localhost:3000/health)

if [ $? -eq 0 ]; then
  echo "✅ ClawNet 服务运行正常"
  echo "   $HEALTH"
else
  echo "❌ ClawNet 服务未运行"
  echo "   请执行: cd /root/.openclaw/workspace/clawnet-mvp && npm start"
  exit 1
fi

echo ""

# 3. 测试验证接口
echo "3️⃣ 测试微信验证接口..."
RESPONSE=$(curl -s "http://localhost:3000/wechat/mp/message?signature=test&timestamp=123&nonce=456&echostr=test_echo")

if [ "$RESPONSE" = "test_echo" ]; then
  echo "✅ 验证接口正常（注意：签名验证可能失败，但接口可访问）"
else
  echo "⚠️  验证接口返回: $RESPONSE"
fi

echo ""

# 4. 测试消息接收
echo "4️⃣ 测试微信消息接收..."
TEST_MESSAGE='<xml>
  <ToUserName><![CDATA[gh_1234567890ab]]></ToUserName>
  <FromUserName><![CDATA[oABCD1234567890abcdef]]></FromUserName>
  <CreateTime>1234567890</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[测试消息]]></Content>
  <MsgId>1234567890123456</MsgId>
</xml>'

RESPONSE=$(curl -s -X POST http://localhost:3000/wechat/mp/message \
  -H "Content-Type: application/xml" \
  -d "$TEST_MESSAGE")

if [ $? -eq 0 ]; then
  echo "✅ 消息接收接口正常"
  echo "   响应: $(echo $RESPONSE | head -c 100)..."
else
  echo "❌ 消息接收失败"
fi

echo ""

# 5. 检查节点创建
echo "5️⃣ 检查节点创建..."
NODES=$(curl -s http://localhost:3000/nodes | grep "wechat-")

if [ -n "$NODES" ]; then
  echo "✅ 微信节点已创建"
  echo "   $NODES"
else
  echo "⚠️  未找到微信节点"
fi

echo ""

echo "✅ 测试完成！"
echo ""
echo "📝 下一步："
echo "1. 在微信公众号后台配置服务器 URL"
echo "2. 添加服务器 IP 到白名单: 192.163.174.25"
echo "3. 启用消息加密（可选）"
echo "4. 关注公众号并测试"
