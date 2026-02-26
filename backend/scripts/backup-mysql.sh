#!/bin/bash
# Script de Backup Automático do MySQL
# Mercado Harley - Sick Grip

# Configurações
DB_NAME="mercado_harley"
DB_USER="harley_user"
DB_PASSWORD="yepR1SAULoY7a16B83DgSObvQwNFp3cOObSQaD4jRGk="
BACKUP_DIR="/backups/mysql"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mercado_harley_$DATE.sql.gz"
RETENTION_DAYS=7

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Fazer backup
echo "🔄 Iniciando backup do banco de dados..."
mysqldump -u $DB_USER -p"$DB_PASSWORD" $DB_NAME | gzip > $BACKUP_FILE

# Verificar se o backup foi criado
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup criado com sucesso: $BACKUP_FILE ($SIZE)"
    
    # Remover backups antigos (mais de 7 dias)
    find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "🧹 Backups antigos removidos (mais de $RETENTION_DAYS dias)"
    
    # Listar backups disponíveis
    echo "📦 Backups disponíveis:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "   Nenhum backup encontrado"
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi
