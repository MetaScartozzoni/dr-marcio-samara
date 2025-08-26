# 🗑️ ARQUIVOS E PASTAS PARA REMOVER ANTES DO UPLOAD

## ❌ **REMOVER ESTAS PASTAS COMPLETAS:**

### 📁 **Pastas de desenvolvimento (DELETAR):**
```
node_modules/           ← Muito pesada, não precisa no servidor
.vscode/               ← Configurações do VS Code
_backup-antes-copia/   ← Backup local
_lixeira/              ← Arquivos descartados
src/                   ← Código fonte de desenvolvimento
portal-dr-marcio/      ← Pasta duplicada
```

### 📁 **Pastas desnecessárias:**
```
supabase/              ← Configurações locais do Supabase
js/                    ← Parece ser pasta duplicada dos assets
integracoes/           ← Pasta antiga (use integrations/)
```

---

## ❌ **REMOVER ESTES ARQUIVOS:**

### 📄 **Arquivos de desenvolvimento:**
```
.DS_Store              ← Arquivo do macOS
package.json           ← Configuração Node.js
package-lock.json      ← Lock do Node.js
ecosystem.config.js    ← Configuração PM2
server.js              ← Servidor de desenvolvimento
server-auth.js         ← Auth de desenvolvimento
```

### 📄 **Arquivos de documentação/desenvolvimento:**
```
DEPLOY_VERCEL_SUPABASE.md
README-HOSTINGER.md
README-SUPABASE.md
README-SUPABASE-OFICIAL.md
FUNCIONALIDADES-PROFISSIONAIS.md
CHECKLIST-PRODUCAO.md
CHECKLIST-FILEZILLA-UPLOAD.md
UPLOAD-FINAL-FILEZILLA.md
README-SISTEMA-COMPLETO.md
LEIA-ME-UPLOAD.txt
```

### 📄 **Arquivos duplicados/antigos:**
```
login-novo.html        ← Arquivo vazio
dashboard-novo.html    ← Arquivo vazio
dashboard-final.html   ← Arquivo vazio
htaccess.txt          ← Use o .htaccess-robusto
.htaccess-backup      ← Backup desnecessário
teste-fluxo.html      ← Arquivo de teste vazio
config-producao-completa.js ← Use o config.js normal
```

### 📄 **Scripts de desenvolvimento:**
```
instalar-sistema-definitivo.js
sistema-recuperacao-definitivo.js
card-unificado.js     ← Parece duplicado
style.css             ← Use os CSS da pasta assets
```

---

## ✅ **RESUMO: O QUE MANTER:**

### 📄 **Arquivos principais (MANTER):**
```
index.html
login.html
dashboard-admin.html
manifest.json
sw.js
offline.html
portal-master-init.js
portal-master-init.css
robots.txt
sitemap.xml
404.html
500.html
config-producao.json
```

### 📁 **Pastas essenciais (MANTER):**
```
assets/               ← CSS, JS, imagens
components/           ← Sistema de componentes
features/            ← Funcionalidades profissionais
integrations/        ← Integrações
analytics/           ← Sistema de métricas
test/               ← Suite de testes
modules/            ← Módulos médicos
```

### 📄 **Arquivos HTML dos módulos (MANTER):**
```
Todos os .html da raiz que são páginas funcionais:
- cadastro.html
- dashboard.html
- agendamento-detalhes.html
- agendar.html
- aprovacoes.html
- ativar-conta.html
- caderno-digital.html
- cirurgia-plastica.html
- configuracoes-sistema.html
- criar-senha.html
- dashboard-funcionario.html
- esqueci-senha.html
- gestao-financeira.html
- gestao.html
- jornada-paciente.html
- landing-publica.html
- leads-manager.html
- lgpd-compliance.html
- orcamento.html
- pending.html
- pre-cadastro.html
- prontuarios.html
- quadro-evolutivo.html
- recuperar-senha.html
- senha.html
- setup.html
- verificar-email.html
- videochamada.html
(e outros arquivos .html funcionais)
```

---

## 🔧 **SCRIPT PARA LIMPEZA RÁPIDA:**

Execute estes comandos no terminal para remover tudo de uma vez:

```bash
# Remover pastas desnecessárias
rm -rf node_modules/
rm -rf .vscode/
rm -rf _backup-antes-copia/
rm -rf _lixeira/
rm -rf src/
rm -rf portal-dr-marcio/
rm -rf supabase/
rm -rf js/
rm -rf integracoes/

# Remover arquivos desnecessários
rm .DS_Store
rm package.json
rm package-lock.json
rm ecosystem.config.js
rm server.js
rm server-auth.js
rm *.md
rm LEIA-ME-UPLOAD.txt
rm login-novo.html
rm dashboard-novo.html
rm dashboard-final.html
rm htaccess.txt
rm .htaccess-backup
rm teste-fluxo.html
rm config-producao-completa.js
rm instalar-sistema-definitivo.js
rm sistema-recuperacao-definitivo.js
rm card-unificado.js
rm style.css
```

---

## 🎯 **ESTRATÉGIA RECOMENDADA:**

1. **Copie a pasta completa** para o FileZilla
2. **No servidor**, delete essas pastas/arquivos que listei acima
3. **Renomeie** `.htaccess-robusto` para `.htaccess`
4. **Teste** acessando `dashboard-admin.html`

### **Tamanho da pasta após limpeza:**
- **Antes:** ~100MB (com node_modules)
- **Depois:** ~5-10MB (só o essencial)

**Muito mais fácil e rápido! 🚀**
