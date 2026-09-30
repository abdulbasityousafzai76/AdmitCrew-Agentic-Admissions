@echo off
title AdmitCrew - Local Website
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (
  echo Python launcher was not found. Install Python, then double-click this file again.
  pause
  exit /b 1
)
set "ADMITCREW_OPEN_BROWSER=1"
py app.py
if errorlevel 1 (
  echo.
  echo AdmitCrew could not start. Read the error above, then press any key.
  pause
)
