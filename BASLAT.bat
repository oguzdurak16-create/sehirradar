@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (
  echo [HATA] Node.js 20.9 veya daha yeni bir sürüm gerekli.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Paketler kuruluyor...
  call npm install || goto :error
)
echo Şehir Radar başlatılıyor: http://localhost:3000
call npm run dev
goto :eof
:error
echo.
echo [HATA] Kurulum veya başlatma başarısız.
pause
exit /b 1
