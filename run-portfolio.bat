@echo off
title Vivek Bharat Toradmal - Engineering Portfolio
cd /d "%~dp0"

echo =================================================================
echo   Vivek Bharat Toradmal - Engineering Portfolio Launcher
echo   Robotics (ROS 2) ^| CAD/CAM ^| Embedded IoT ^| 3D Digital Twin
echo =================================================================
echo.
echo Launching Portfolio in your default web browser...

start "" "%~dp0index.html"

echo.
echo Application is running! You can close this window at any time.
timeout /t 3 >nul
exit
