package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

type groupRepo struct{ db *sql.DB }

// NewGroupRepo returns a GroupRepo backed by SQLite.
func NewGroupRepo(db *sql.DB) storage.GroupRepo {
	return &groupRepo{db: db}
}

func (r *groupRepo) Get(ctx context.Context, jid string) (*storage.Group, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT jid, name, created_at, updated_at FROM groups WHERE jid=?`, jid)
	g, err := scanGroup(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return g, err
}

func (r *groupRepo) Upsert(ctx context.Context, g *storage.Group) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO groups(jid, name) VALUES(?,?)
		 ON CONFLICT(jid) DO UPDATE SET name=excluded.name, updated_at=datetime('now')`,
		g.JID, g.Name)
	return err
}

func (r *groupRepo) List(ctx context.Context) ([]*storage.Group, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT jid, name, created_at, updated_at FROM groups ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var groups []*storage.Group
	for rows.Next() {
		g, err := scanGroup(rows)
		if err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}

func (r *groupRepo) Delete(ctx context.Context, jid string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM groups WHERE jid=?`, jid)
	return err
}

func (r *groupRepo) GetPermissions(ctx context.Context, jid string) ([]storage.Permission, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT permission FROM group_permissions WHERE group_jid=?`, jid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var perms []storage.Permission
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		perms = append(perms, storage.Permission(p))
	}
	return perms, rows.Err()
}

func (r *groupRepo) SetPermissions(ctx context.Context, jid string, perms []storage.Permission) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM group_permissions WHERE group_jid=?`, jid); err != nil {
		return err
	}
	for _, p := range perms {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO group_permissions(group_jid, permission) VALUES(?,?)`, jid, string(p)); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *groupRepo) HasPermission(ctx context.Context, jid string, perm storage.Permission) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM group_permissions WHERE group_jid=? AND permission=?`,
		jid, string(perm)).Scan(&count)
	return count > 0, err
}

func (r *groupRepo) GetConfig(ctx context.Context, jid string) (*storage.GroupConfig, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT group_jid, bot_prefix, system_prompt, image_cooldown_enabled, image_cooldown_minutes, updated_at
		 FROM group_configs WHERE group_jid=?`, jid)
	var gc storage.GroupConfig
	var (
		bp, sp, ice, icm sql.NullString
		updatedAt        string
	)
	err := row.Scan(&gc.GroupJID, &bp, &sp, &ice, &icm, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("group config get: %w", err)
	}
	if bp.Valid {
		gc.BotPrefix = &bp.String
	}
	if sp.Valid {
		gc.SystemPrompt = &sp.String
	}
	if ice.Valid {
		v := ice.String == "1"
		gc.ImageCooldownEnabled = &v
	}
	if icm.Valid {
		// parse int from string
		var n int
		fmt.Sscan(icm.String, &n)
		gc.ImageCooldownMinutes = &n
	}
	gc.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return &gc, nil
}

func (r *groupRepo) SetConfig(ctx context.Context, cfg storage.GroupConfig) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO group_configs(group_jid, bot_prefix, system_prompt, image_cooldown_enabled, image_cooldown_minutes)
		 VALUES(?,?,?,?,?)
		 ON CONFLICT(group_jid) DO UPDATE SET
		   bot_prefix=excluded.bot_prefix,
		   system_prompt=excluded.system_prompt,
		   image_cooldown_enabled=excluded.image_cooldown_enabled,
		   image_cooldown_minutes=excluded.image_cooldown_minutes,
		   updated_at=datetime('now')`,
		cfg.GroupJID,
		nullableString(cfg.BotPrefix),
		nullableString(cfg.SystemPrompt),
		nullableBool(cfg.ImageCooldownEnabled),
		nullableInt(cfg.ImageCooldownMinutes),
	)
	return err
}

func (r *groupRepo) GetMembers(ctx context.Context, jid string) ([]*storage.GroupMember, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT group_jid, user_jid, name, updated_at FROM group_members WHERE group_jid=?`, jid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var members []*storage.GroupMember
	for rows.Next() {
		m := &storage.GroupMember{}
		var updatedAt string
		if err := rows.Scan(&m.GroupJID, &m.UserJID, &m.Name, &updatedAt); err != nil {
			return nil, err
		}
		m.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		members = append(members, m)
	}
	return members, rows.Err()
}

func (r *groupRepo) UpsertMember(ctx context.Context, m storage.GroupMember) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO group_members(group_jid, user_jid, name) VALUES(?,?,?)
		 ON CONFLICT(group_jid, user_jid) DO UPDATE SET name=excluded.name, updated_at=datetime('now')`,
		m.GroupJID, m.UserJID, m.Name)
	return err
}

// --- helpers ---

type scanner interface {
	Scan(dest ...any) error
}

func scanGroup(s scanner) (*storage.Group, error) {
	g := &storage.Group{}
	var createdAt, updatedAt string
	if err := s.Scan(&g.JID, &g.Name, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	g.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	g.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return g, nil
}

func nullableString(p *string) sql.NullString {
	if p == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *p, Valid: true}
}

func nullableBool(p *bool) sql.NullString {
	if p == nil {
		return sql.NullString{}
	}
	v := "0"
	if *p {
		v = "1"
	}
	return sql.NullString{String: v, Valid: true}
}

func nullableInt(p *int) sql.NullString {
	if p == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: fmt.Sprintf("%d", *p), Valid: true}
}
