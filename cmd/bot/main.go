package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	waLog "go.mau.fi/whatsmeow/util/log"
	"golang.org/x/sync/errgroup"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"

	apiserver "github.com/leleuvilela/leniser-wpp/internal/api"
	"github.com/leleuvilela/leniser-wpp/internal/bot"
	"github.com/leleuvilela/leniser-wpp/internal/command"
	"github.com/leleuvilela/leniser-wpp/internal/config"
	"github.com/leleuvilela/leniser-wpp/internal/listener"
	"github.com/leleuvilela/leniser-wpp/internal/service"
	sqliterepo "github.com/leleuvilela/leniser-wpp/internal/storage/sqlite"

	moderncsqlite "modernc.org/sqlite"
)

func init() {
	// modernc.org/sqlite ignores DSN pragma parameters; use the connection hook
	// to enable foreign-key enforcement on every new connection.
	moderncsqlite.RegisterConnectionHook(func(conn moderncsqlite.ExecQuerierContext, dsn string) error {
		_, err := conn.ExecContext(context.Background(), "PRAGMA foreign_keys = ON;", nil)
		return err
	})
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "[main] fatal:", err)
		os.Exit(1)
	}
}

func run() error {
	cfg := config.Load()

	// --- App database (migrations + repos) ---
	appDB, err := sqliterepo.Open(cfg.DBPath)
	if err != nil {
		return fmt.Errorf("open app db: %w", err)
	}
	defer appDB.Close()

	groupRepo := sqliterepo.NewGroupRepo(appDB)
	configRepo := sqliterepo.NewConfigRepo(appDB)
	msgRepo := sqliterepo.NewMessageRepo(appDB)
	reqRepo := sqliterepo.NewReqRegisterRepo(appDB)

	// --- WhatsApp session store (separate DB managed by whatsmeow) ---
	waDBPath := cfg.DBPath + ".wa.db"
	waDB, err := sql.Open("sqlite", waDBPath+"?_journal_mode=WAL")
	if err != nil {
		return fmt.Errorf("open wa db: %w", err)
	}
	defer waDB.Close()

	waLogger := waLog.Stdout("whatsmeow", "INFO", true)
	storeContainer := sqlstore.NewWithDB(waDB, "sqlite3", waLogger)
	if err := storeContainer.Upgrade(context.Background()); err != nil {
		return fmt.Errorf("wa store upgrade: %w", err)
	}

	deviceStore, err := storeContainer.GetFirstDevice(context.Background())
	if err != nil {
		return fmt.Errorf("get first device: %w", err)
	}

	waClient := whatsmeow.NewClient(deviceStore, waLogger)
	sender := bot.NewSender(waClient)

	// --- External services ---
	openaiSvc := service.NewOpenAIService(cfg.OpenAIAPIKey)
	sunoSvc := service.NewSunoService(cfg.SunoAPIURL)
	imgflipSvc := service.NewImgflipService(cfg.ImgflipUsername, cfg.ImgflipPassword)

	// --- Command registry ---
	registry := command.NewRegistry()

	// Phase 3 (US1): !ping — bypasses permission gate
	registry.Register(command.NewPingHandler(sender, configRepo))

	// Phase 6 — easter eggs
	registry.Register(command.NewDeuitaHandler(sender))
	registry.Register(command.NewGilsoHandler(sender))

	// Phase 7 (US2): !bot
	registry.Register(command.NewBotHandler(sender, openaiSvc, configRepo, reqRepo))

	// Phase 8 (US3): !imagem
	registry.Register(command.NewImagemHandler(sender, openaiSvc, configRepo, reqRepo))

	// Phase 9 (US4): !fala
	registry.Register(command.NewFalaHandler(sender, openaiSvc, reqRepo))

	// Phase 10 (US5): !transcrever
	registry.Register(command.NewTranscreverHandler(sender, openaiSvc, reqRepo, waClient))

	// Phase 11 (US6): !musica
	registry.Register(command.NewMusicaHandler(sender, sunoSvc, reqRepo))

	// Phase 12 (US7): !meme, !aimeme
	registry.Register(command.NewMemeHandler(sender, imgflipSvc, reqRepo))
	registry.Register(command.NewAiMemeHandler(sender, imgflipSvc, reqRepo))

	// Phase 13 (US8): !resumo
	registry.Register(command.NewResumoHandler(sender, openaiSvc, msgRepo, groupRepo, reqRepo))

	// Phase 14 (US9): !ranking
	registry.Register(command.NewRankingHandler(sender, msgRepo, groupRepo))

	// Phase 15 (US10): !msgsdia
	registry.Register(command.NewMsgsDiaHandler(sender, msgRepo))

	// Phase 16 (US11): !sticker
	registry.Register(command.NewStickerHandler(sender, waClient))

	// Phase 17 (US12): !mp3
	registry.Register(command.NewMp3Handler(sender, waClient))

	// Phase 18 (US13): !checagem, !vainele
	registry.Register(command.NewChecagemHandler(sender))
	registry.Register(command.NewVaiNeleHandler(sender))

	// Phase 19 (US14): !menu
	registry.Register(command.NewMenuHandler(sender))

	// Phase 20 (US15): !aa
	registry.Register(command.NewAaHandler(sender))

	// --- Bot ---
	b := bot.New(waClient, registry, groupRepo, msgRepo)

	// Phase 4 (US17): auto-register new groups
	b.AddEventHandler(listener.NewGroupJoinListener(groupRepo).HandleEvent)

	// Phase 6 (US16): message revoke disclosure
	b.AddEventHandler(listener.NewRevokeListener(groupRepo, sender).HandleEvent)

	// --- API server ---
	server := apiserver.NewServer(cfg, groupRepo, configRepo, waClient)

	// --- Run both concurrently ---
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	eg, ctx := errgroup.WithContext(ctx)

	eg.Go(func() error {
		return b.Start(ctx)
	})

	eg.Go(func() error {
		return server.ListenAndServe(ctx)
	})

	if err := eg.Wait(); err != nil && err != context.Canceled {
		return err
	}
	return nil
}
