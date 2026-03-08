#!/bin/bash

echo "=========================================="
echo "CloudEdgeFrontend 部署脚本"
echo "=========================================="

echo ""
echo "请选择部署方式："
echo "1. 开发模式 (npm run dev) - 适合开发测试"
echo "2. Preview 模式 (npm run preview) - 适合快速预览"
echo "3. 生产模式 (Nginx) - 适合生产环境"
echo ""
read -p "请输入选项 (1/2/3): " choice

case $choice in
    1)
        echo "启动开发服务器..."
        npm run dev
        ;;
    2)
        echo "构建生产版本..."
        npm run build
        echo "启动 Preview 服务器..."
        npm run preview
        ;;
    3)
        echo "检查 Nginx 是否安装..."
        if ! command -v nginx &> /dev/null; then
            echo "Nginx 未安装，正在安装..."
            sudo apt update
            sudo apt install nginx -y
        fi
        
        echo "构建生产版本..."
        npm run build
        
        echo "配置 Nginx..."
        sudo tee /etc/nginx/sites-available/cloudedge-frontend > /dev/null << 'EOF'
server {
    listen 80;
    server_name 192.168.104.8;

    location / {
        root /home/cluster/ZZX/CloudEdgeFrontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    location /api-internal/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api-external/ {
        proxy_pass http://192.168.104.4/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api-gateway/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
        
        echo "启用站点配置..."
        sudo ln -sf /etc/nginx/sites-available/cloudedge-frontend /etc/nginx/sites-enabled/
        
        echo "测试 Nginx 配置..."
        sudo nginx -t
        
        echo "重启 Nginx..."
        sudo systemctl restart nginx
        
        echo ""
        echo "=========================================="
        echo "部署完成！"
        echo "访问地址: http://192.168.104.8"
        echo "=========================================="
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac
