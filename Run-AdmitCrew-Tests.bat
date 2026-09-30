@echo off
title AdmitCrew - Seven Case Test Runner
cd /d "%~dp0"
echo AdmitCrew automated checks. Use only fake test data.
echo The AdmitCrew website must already be running in another black window.
echo.
py -m unittest discover -s tests -v
if errorlevel 1 goto failed
echo.
py live_test.py
if errorlevel 1 goto failed
echo.
echo CHECKS COMPLETED. Record the actual student and staff pages for the video.
pause
exit /b 0
:failed
echo.
echo A check failed. Keep this window open and share only the error lines.
echo Never share your .env, key, or password.
pause
exit /b 1
