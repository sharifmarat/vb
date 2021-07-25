#!/bin/bash -ue

: ${DEST_DIR:=backups}
: ${DB:=vb.sqlite}

backup_file=$DEST_DIR/vb-`date +%Y-%m-%d.%H.%M.%S`.sqlite
last_backup_timestamp=$DEST_DIR/last_backup_timestamp

do_backup=false

if [ -f "$last_backup_timestamp" ]; then
  if [ "$DB" -nt "$last_backup_timestamp" ]; then
    do_backup=true
  fi
else
  do_backup=true
fi

if [ "$do_backup" = "true" ]; then
  mkdir -p "$DEST_DIR"
  sqlite3 "$DB" ".backup $backup_file"
  touch "$last_backup_timestamp"
fi

