package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

type configRepo struct{ db *sql.DB }

// NewConfigRepo returns a ConfigRepo backed by SQLite.
func NewConfigRepo(db *sql.DB) storage.ConfigRepo {
	return &configRepo{db: db}
}

func (r *configRepo) Get(ctx context.Context) (storage.Config, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT bot_prefix, system_prompt, image_cooldown_enabled, image_cooldown_minutes, updated_at
		 FROM config WHERE id = 1`)
	var c storage.Config
	var updatedAt string
	if err := row.Scan(&c.BotPrefix, &c.SystemPrompt, &c.ImageCooldownEnabled,
		&c.ImageCooldownMinutes, &updatedAt); err != nil {
		return c, fmt.Errorf("config get: %w", err)
	}
	c.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return c, nil
}

func (r *configRepo) Set(ctx context.Context, c storage.Config) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE config SET bot_prefix=?, system_prompt=?, image_cooldown_enabled=?,
		 image_cooldown_minutes=?, updated_at=datetime('now') WHERE id=1`,
		c.BotPrefix, c.SystemPrompt, boolToInt(c.ImageCooldownEnabled), c.ImageCooldownMinutes,
	)
	return err
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
