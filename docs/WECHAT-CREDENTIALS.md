# 微信公众号凭证信息

## 配置信息

**AppID:** wxd213e22f3178383b  
**AppSecret:** 5664bceb1f6db3ed3609813e304d1bcd  
**Token:** clawnet  
**EncodingAESKey:** xHzdvi3xjZLXUetUadtlyFM1h9epCkGJswIUbdd8Z0k  

## 服务器配置

**URL:** http://192.163.174.25:3000/wechat/mp/message  
**IP白名单:** 192.163.174.25

## 环境变量设置

```bash
export WECHAT_APPID="wxd213e22f3178383b"
export WECHAT_APPSECRET="5664bceb1f6db3ed3609813e304d1bcd"
export WECHAT_TOKEN="clawnet"
export WECHAT_ENCODING_AES_KEY="xHzdvi3xjZLXUetUadtlyFM1h9epCkGJswIUbdd8Z0k"
```

## 使用文件

```bash
# 复制配置文件
cp .env.wechat.example .env

# 或使用已配置的文件
cp .env.wechat .env
```

## 安全提示

⚠️ 此文件包含敏感信息，请勿提交到 Git！

已在 .gitignore 中排除：
- .env
- .env.wechat
- credentials/

## 文件位置

- 配置示例：`.env.wechat.example`
- 实际配置：`.env.wechat`
- ClawNet 凭证：`/root/.openclaw/credentials/wechat-mp.json`
