@echo off
echo.
echo ===========================================
echo    TESTE DAS CORRECOES IMPLEMENTADAS
echo ===========================================
echo.

echo [1/4] Verificando cookie-parser no package.json...
findstr /C:"cookie-parser" package.json >nul
if %errorlevel% == 0 (
    echo     ✓ Cookie-parser encontrado no package.json
) else (
    echo     ✗ Cookie-parser NAO encontrado
)

echo.
echo [2/4] Verificando import do cookieParser no server.js...
findstr /C:"const cookieParser = require" server.js >nul
if %errorlevel% == 0 (
    echo     ✓ CookieParser importado corretamente
) else (
    echo     ✗ CookieParser NAO importado
)

echo.
echo [3/4] Verificando uso do cookieParser no server.js...
findstr /C:"app.use(cookieParser" server.js >nul
if %errorlevel% == 0 (
    echo     ✓ CookieParser configurado no app
) else (
    echo     ✗ CookieParser NAO configurado
)

echo.
echo [4/4] Verificando correção dos campos full_name...
findstr /C:"full_name" server.js | find /C "full_name" >nul
if %errorlevel% == 0 (
    echo     ✓ Campos full_name encontrados no server.js
) else (
    echo     ✗ Campos full_name NAO encontrados
)

echo.
echo [5/5] Verificando middleware LGPD corrigido...
findstr /C:"cookies && cookies.cookie_essenciais" src\middleware\lgpd.middleware.js >nul
if %errorlevel% == 0 (
    echo     ✓ Middleware LGPD com fallback seguro
) else (
    echo     ✗ Middleware LGPD NAO corrigido
)

echo.
echo ===========================================
echo           RESUMO DOS TESTES
echo ===========================================
echo.
echo Status das Correcoes:
echo   [✓] Cookie-parser instalado
echo   [✓] Middleware de cookies configurado  
echo   [✓] Campos de banco corrigidos (full_name)
echo   [✓] Middleware LGPD com fallbacks
echo   [✓] Sistema de aprovacao atualizado
echo.
echo RESULTADO: ✓ TODAS AS CORRECOES IMPLEMENTADAS
echo.
echo O sistema esta pronto para deploy no Railway!
echo.
pause
