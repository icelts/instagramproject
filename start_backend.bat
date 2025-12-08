@echo off
echo ============================================
echo    Instagram自动化平台后端启动脚本
echo ============================================
echo.

REM 检查虚拟环境是否存在
if not exist "venv\Scripts\python.exe" (
    echo 正在创建虚拟环境...
    python -m venv venv
    echo 虚拟环境创建完成！
    echo.
)

REM 激活虚拟环境并安装依赖
echo 正在激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat

REM 检查依赖是否已安装
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo 正在安装项目依赖...
    pip install -r backend/requirements.txt
    echo 依赖安装完成！
    echo.
)

REM 启动后端服务
echo 正在启动后端服务...
echo 访问地址: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo 按 Ctrl+C 停止服务
echo.

cd backend
python run.py

pause
