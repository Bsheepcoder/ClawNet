#!/bin/bash

# Nginx 快速配置脚本

echo "🔧 配置 Nginx 反向代理"
echo ""

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx 未安装"
    echo ""
    echo "安装 Nginx："
    echo "  Ubuntu/Debian: sudo apt-get install nginx"
    echo "  CentOS/RHEL:   sudo yum install nginx"
    exit 1
fi

echo "✅ Nginx 已安装"

# 创建配置目录
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# 复制配置文件
sudo cp nginx/wechat-proxy.conf /etc/nginx/sites-available/clawnet.conf

# 创建软链接
if [ ! -L /etc/nginx/sites-enabled/clawnet.conf ]; then
    sudo ln -s /etc/nginx/sites-available/clawnet.conf /etc/nginx/sites-enabled/clawnet.conf
    echo "✅ 配置文件已链接"
else
    echo "⚠️  配置文件链接已存在"
fi

# 测试配置
echo ""
echo "🧪 测试 Nginx 配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ 配置正确"
    
    # 重启 Nginx
    echo ""
    echo "🔄 重启 Nginx..."
    sudo systemctl restart nginx
    
    echo ""
    echo "✅ Nginx 配置完成！"
    echo ""
    echo "📝 微信公众号配置："
    echo "   URL: http://192.163.174.25/wechat/mp/message"
    echo "   Token: clawnet-mp-verify-202603160152"
    echo ""
else
    echo "❌ 配置有误，请检查"
    exit 1
fi
