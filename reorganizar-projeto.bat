@echo off
REM 🚀 SCRIPT DE REORGANIZAÇÃO - PORTAL DR. MARCIO (Windows)
echo 🏗️ Reorganizando estrutura do projeto...

REM Verificar se está no diretório correto
if not exist "server.js" (
    echo ❌ Erro: Execute este script na pasta do projeto ^(onde está server.js^)
    pause
    exit /b 1
)

REM Criar estrutura de pastas
echo 📁 Criando estrutura de pastas...
mkdir "C:\Users\Dr. Marcio\projetos" 2>nul

REM Verificar se a pasta de destino já existe
if exist "C:\Users\Dr. Marcio\projetos\portal-dr-marcio" (
    echo ⚠️  Pasta de destino já existe!
    echo 🗑️  Removendo pasta antiga...
    rmdir /s /q "C:\Users\Dr. Marcio\projetos\portal-dr-marcio"
)

echo 📦 Copiando arquivos para nova estrutura...

REM Copiar todo o conteúdo (exceto esta pasta atual para evitar recursão)
xcopy "*.*" "C:\Users\Dr. Marcio\projetos\portal-dr-marcio\" /E /H /Y /EXCLUDE:exclude.txt

echo ✅ Projeto reorganizado com sucesso!
echo.
echo 📋 Nova localização:
echo    C:\Users\Dr. Marcio\projetos\portal-dr-marcio\
echo.
echo 🔧 Próximos passos:
echo    1. Feche o VS Code atual
echo    2. Abra nova pasta: C:\Users\Dr. Marcio\projetos\portal-dr-marcio
echo    3. Instale Node.js se necessário
echo.
echo 🌐 Production continua funcionando normalmente no Railway!
pause
