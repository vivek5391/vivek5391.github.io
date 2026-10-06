@echo off
title Vivek Bharat Toradmal - Portfolio Server
cd /d "%~dp0"

echo =================================================================
echo   Vivek Bharat Toradmal - Engineering Portfolio Launcher
echo   Robotics (ROS 2) ^| CAD/CAM ^| Embedded IoT ^| Industrial ERP
echo =================================================================
echo.
echo Starting local web server on port 3000...
echo.

start "" http://localhost:3000

python -m http.server 3000 2>nul || (
    echo Python not found in PATH, opening directly in your web browser...
    start "" "%~dp0index.html"
)
pause
