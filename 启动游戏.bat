@echo off
cd /d "C:\Users\34046\CodeBuddy\20260520212226"
echo 正在启动 挖个爽 服务器...
start "" http://localhost:3000
py -m http.server 3000
pause
