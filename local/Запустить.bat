@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py weblate_local.py) else (python weblate_local.py)
if errorlevel 1 (
  echo.
  echo Не получилось запустить. Установи Python с https://www.python.org/downloads/ ^(при установке отметь "Add python.exe to PATH"^)
)
pause
