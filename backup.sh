#!/bin/bash

# Simple backup script for SQLite database
# Usage: ./backup.sh [optional_backup_name]

BACKUP_DIR="./backups"
DB_PATH="./backend/api/messages.sqlite"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME=${1:-"messages_backup_$TIMESTAMP.sqlite"}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"
    echo "✅ Database backup created: $BACKUP_DIR/$BACKUP_NAME"
    echo "📊 Backup size: $(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)"

    # Keep only last 10 backups
    cd "$BACKUP_DIR" && ls -t *.sqlite | tail -n +11 | xargs -r rm -f
    echo "🧹 Cleaned up old backups (keeping last 10)"
else
    echo "❌ Database file not found: $DB_PATH"
    exit 1
fi