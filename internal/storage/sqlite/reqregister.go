package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

type reqRegisterRepo struct{ db *sql.DB }

// NewReqRegisterRepo returns a ReqRegisterRepo backed by SQLite.
func NewReqRegisterRepo(db *sql.DB) storage.ReqRegisterRepo {
	return &reqRegisterRepo{db: db}
}

func (r *reqRegisterRepo) Save(ctx context.Context, reg storage.RequestRegister) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO request_registers(id, group_jid, author_jid, req_type)
		 VALUES(lower(hex(randomblob(16))),?,?,?)`,
		reg.GroupJID, reg.AuthorJID, string(reg.ReqType),
	)
	return err
}

func (r *reqRegisterRepo) LastByGroup(ctx context.Context, groupJID string, t storage.RequestType) (*storage.RequestRegister, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, group_jid, author_jid, req_type, created_at
		 FROM request_registers
		 WHERE group_jid=? AND req_type=?
		 ORDER BY created_at DESC LIMIT 1`,
		groupJID, string(t),
	)
	return scanReqRegister(row)
}

func (r *reqRegisterRepo) LastByAuthor(ctx context.Context, authorJID string, t storage.RequestType) (*storage.RequestRegister, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, group_jid, author_jid, req_type, created_at
		 FROM request_registers
		 WHERE author_jid=? AND req_type=?
		 ORDER BY created_at DESC LIMIT 1`,
		authorJID, string(t),
	)
	return scanReqRegister(row)
}

func scanReqRegister(row *sql.Row) (*storage.RequestRegister, error) {
	reg := &storage.RequestRegister{}
	var createdAt string
	err := row.Scan(&reg.ID, &reg.GroupJID, &reg.AuthorJID, &reg.ReqType, &createdAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("req register scan: %w", err)
	}
	reg.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	return reg, nil
}
