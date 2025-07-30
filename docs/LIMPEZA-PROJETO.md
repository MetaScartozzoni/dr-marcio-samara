# 🧹 SCRIPT DE LIMPEZA - PORTAL DR. MARCIO

## Arquivos Sugeridos para Remoção/Organização

### 📋 **PRIORIDADE ALTA - Remover Antes do Commit**

#### 1. **Arquivos Duplicados/Desatualizados**
```bash
# Remover versões antigas e duplicadas
rm gestao-script.js              # Versão antiga, substituída por gestao-script-v2.js
rm gestao-script-new.js          # Versão intermediária, não necessária
rm gestao.html                   # Versão antiga, substituída por gestao-melhorado.html

# Manter apenas:
# - gestao-script-v2.js (versão melhorada)
# - gestao-melhorado.html (versão atualizada)
# - gestao-improvements.css (estilos das melhorias)
```

#### 2. **Arquivos de Backup/Temporários**
```bash
# Remover backups antigos
rm admin-old.html
rm agendar-old.html
rm agendar-backup.html
rm package-backup.json

# Arquivos de teste temporários
rm server-test.js
rm server-simple.js
rm test-sendgrid.js
rm test-sendgrid-final.js
rm test-sms-real.js
rm teste-completo-sms.js
rm test-local.sh
```

#### 3. **Logs e Console Debugging**
```bash
# Arquivo: gestao-script-v2.js - Limpar console.logs de debug
# Manter apenas logs de erro importantes
```

### 📋 **PRIORIDADE MÉDIA - Organizar**

#### 4. **Pasta de Testes**
```bash
# Mover todos os arquivos de teste para uma pasta organizada
mkdir -p tests/legacy
mv test/ tests/legacy/
mv test-*.js tests/legacy/
```

#### 5. **Estrutura de Pastas**
```bash
# Organizar arquivos por categoria
mkdir -p docs/
mv README-melhorias.md docs/
mv config-api-integration.js config/
```

### 📋 **PRIORIDADE BAIXA - Otimização**

#### 6. **Comentários e Documentação**
- Remover comentários de debug
- Padronizar comentários JSDoc
- Remover código comentado não utilizado

---

## 🚀 **SCRIPT AUTOMATIZADO DE LIMPEZA**

Criei um script para executar automaticamente:

```bash
#!/bin/bash
echo "🧹 Iniciando limpeza do projeto..."

# 1. Criar backup de segurança
echo "📦 Criando backup..."
tar -czf backup-antes-limpeza-$(date +%Y%m%d-%H%M%S).tar.gz \
  gestao-script.js gestao.html admin-old.html agendar-old.html \
  package-backup.json test-*.js server-test.js

# 2. Remover arquivos duplicados/antigos
echo "🗑️  Removendo arquivos antigos..."
rm -f gestao-script.js
rm -f gestao-script-new.js  
rm -f gestao.html
rm -f admin-old.html
rm -f agendar-old.html
rm -f agendar-backup.html
rm -f package-backup.json

# 3. Remover arquivos de teste temporários
echo "🧪 Removendo testes temporários..."
rm -f server-test.js
rm -f server-simple.js
rm -f test-sendgrid*.js
rm -f test-sms-real.js
rm -f teste-completo-sms.js
rm -f test-local.sh

# 4. Organizar estrutura
echo "📁 Organizando estrutura..."
mkdir -p tests/legacy docs config

# Mover testes antigos
if [ -d "test/" ]; then
  mv test/ tests/legacy/
fi

# Mover arquivos de teste restantes
mv test-*.js tests/legacy/ 2>/dev/null || true

# Mover documentação
mv README-melhorias.md docs/ 2>/dev/null || true

# 5. Renomear arquivos para versão final
echo "🔄 Renomeando para versão final..."
mv gestao-script-v2.js gestao-script.js
mv gestao-melhorado.html gestao.html

echo "✅ Limpeza concluída!"
echo "📊 Arquivos removidos/organizados:"
echo "   - Removidos: arquivos antigos e duplicados"
echo "   - Organizados: testes em tests/legacy/"
echo "   - Documentação em docs/"
echo "   - Renomeados: versões v2 → versão final"
```

---

## 🎯 **ANÁLISE ESPECÍFICA DO PROJETO**

### **Arquivos Identificados para Limpeza:**

#### ❌ **Remover Completamente:**
1. `gestao-script.js` (versão antiga com problemas)
2. `gestao-script-new.js` (versão intermediária)
3. `gestao.html` (versão antiga)
4. `admin-old.html` (backup antigo)
5. `agendar-old.html` (backup antigo)
6. `agendar-backup.html` (backup desnecessário)
7. `package-backup.json` (backup antigo)
8. `server-test.js` (teste temporário)
9. `test-sendgrid*.js` (testes de email temporários)
10. `test-sms-real.js` (teste de SMS temporário)

#### 🔄 **Renomear/Substituir:**
1. `gestao-script-v2.js` → `gestao-script.js`
2. `gestao-melhorado.html` → `gestao.html`

#### 📁 **Organizar:**
1. Mover testes para `tests/legacy/`
2. Mover documentação para `docs/`
3. Mover configurações para `config/`

---

## 📋 **CHECKLIST ANTES DO COMMIT**

### ✅ **Verificações Essenciais:**

```bash
# 1. Verificar se não há arquivos duplicados
ls -la *.js | grep gestao

# 2. Verificar se não há console.log de debug
grep -n "console.log" gestao-script.js

# 3. Verificar se não há TODOs ou FIXMEs críticos
grep -rn "TODO\|FIXME\|XXX" *.js *.html

# 4. Verificar tamanho dos arquivos
du -h *.js *.html *.css

# 5. Testar se tudo funciona
# Abrir gestao.html no navegador e testar funcionalidades básicas
```

### 🎯 **Métricas de Limpeza:**
- **Antes:** ~50+ arquivos diversos
- **Depois:** ~15 arquivos organizados
- **Redução:** ~70% de arquivos desnecessários
- **Estrutura:** Organizada e profissional

---

## 🚀 **COMANDOS PARA EXECUÇÃO IMEDIATA**

Execute estes comandos na ordem:

```bash
# 1. Backup de segurança
tar -czf backup-pre-cleanup-$(date +%Y%m%d).tar.gz gestao-script*.js gestao*.html *-old.html *-backup.* test-*.js

# 2. Limpeza básica
rm gestao-script.js gestao-script-new.js gestao.html admin-old.html agendar-old.html agendar-backup.html

# 3. Limpeza de testes temporários  
rm server-test.js test-sendgrid*.js test-sms-real.js teste-completo-sms.js

# 4. Renomeação final
mv gestao-script-v2.js gestao-script.js
mv gestao-melhorado.html gestao.html

# 5. Organização
mkdir -p tests/legacy docs
mv test-*.js tests/legacy/ 2>/dev/null || true
mv README-melhorias.md docs/

# 6. Verificação final
ls -la *.js *.html *.css | grep -E "(gestao|admin|agendar)"
```

Essa limpeza deixará o projeto muito mais organizado e profissional antes do commit! 

Deseja que eu execute alguma parte específica dessa limpeza?
