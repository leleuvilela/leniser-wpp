package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

type messageRepo struct{ db *sql.DB }

// NewMessageRepo returns a MessageRepo backed by SQLite.
func NewMessageRepo(db *sql.DB) storage.MessageRepo {
	return &messageRepo{db: db}
}

func (r *messageRepo) Save(ctx context.Context, rec storage.MessageRecord) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO message_records
		 (id, group_jid, author_jid, message_type, has_media, is_forwarded,
		  character_count, day, timestamp_utc, timestamp_local)
		 VALUES (?,?,?,?,?,?,?,?,?,?)`,
		rec.ID, rec.GroupJID, rec.AuthorJID, rec.MessageType,
		boolToInt(rec.HasMedia), boolToInt(rec.IsForwarded),
		rec.CharacterCount, rec.Day,
		rec.TimestampUTC.Unix(), rec.TimestampLocal.Unix(),
	)
	return err
}

func (r *messageRepo) CountByAuthor(ctx context.Context, groupJID string, from, to time.Time) ([]storage.AuthorCount, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT author_jid, COUNT(*) as cnt
		 FROM message_records
		 WHERE group_jid=? AND timestamp_utc>=? AND timestamp_utc<?
		 GROUP BY author_jid
		 ORDER BY cnt DESC`,
		groupJID, from.Unix(), to.Unix(),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var counts []storage.AuthorCount
	for rows.Next() {
		var ac storage.AuthorCount
		if err := rows.Scan(&ac.AuthorJID, &ac.Count); err != nil {
			return nil, err
		}
		counts = append(counts, ac)
	}
	return counts, rows.Err()
}

func (r *messageRepo) CountByDay(ctx context.Context, groupJID string) ([]storage.DayCount, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT day, COUNT(*) as cnt
		 FROM message_records WHERE group_jid=?
		 GROUP BY day ORDER BY day DESC`,
		groupJID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var counts []storage.DayCount
	for rows.Next() {
		var dc storage.DayCount
		if err := rows.Scan(&dc.Date, &dc.Count); err != nil {
			return nil, err
		}
		counts = append(counts, dc)
	}
	return counts, rows.Err()
}

func (r *messageRepo) ListRecent(ctx context.Context, groupJID string, limit int) ([]*storage.MessageRecord, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, group_jid, author_jid, message_type, has_media, is_forwarded,
		        character_count, day, timestamp_utc, timestamp_local, recorded_at
		 FROM message_records
		 WHERE group_jid=? AND author_jid != ''
		 ORDER BY timestamp_utc DESC LIMIT ?`,
		groupJID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var recs []*storage.MessageRecord
	for rows.Next() {
		rec := &storage.MessageRecord{}
		var tsUTC, tsLocal int64
		var hasMedia, isForwarded int
		var recordedAt string
		if err := rows.Scan(
			&rec.ID, &rec.GroupJID, &rec.AuthorJID, &rec.MessageType,
			&hasMedia, &isForwarded, &rec.CharacterCount, &rec.Day,
			&tsUTC, &tsLocal, &recordedAt,
		); err != nil {
			return nil, err
		}
		rec.HasMedia = hasMedia == 1
		rec.IsForwarded = isForwarded == 1
		rec.TimestampUTC = time.Unix(tsUTC, 0).UTC()
		rec.TimestampLocal = time.Unix(tsLocal, 0)
		rec.RecordedAt, _ = time.Parse("2006-01-02 15:04:05", recordedAt)
		recs = append(recs, rec)
	}
	return recs, rows.Err()
}
