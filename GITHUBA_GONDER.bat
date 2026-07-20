@echo off
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  echo Kullanim: GITHUBA_GONDER.bat https://github.com/kullanici/depo.git
  pause
  exit /b 1
)
git init
git branch -M main
git add .
git commit -m "feat: Sehir Radar ilk surum"
git remote remove origin >nul 2>nul
git remote add origin "%~1"
git push -u origin main
pause
