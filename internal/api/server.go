package api

import (
	"context"
	"crypto/subtle"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"go.mau.fi/whatsmeow"

	"github.com/leleuvilela/leniser-wpp/internal/api/handler"
	"github.com/leleuvilela/leniser-wpp/internal/bot"
	"github.com/leleuvilela/leniser-wpp/internal/config"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// Server wraps the chi router and HTTP server.
type Server struct {
	cfg        config.Config
	httpServer *http.Server
}

// NewServer constructs the chi router, wires all handlers, and returns a Server.
func NewServer(
	cfg config.Config,
	groupRepo storage.GroupRepo,
	configRepo storage.ConfigRepo,
	client *whatsmeow.Client,
) *Server {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)

	// CORS middleware
	r.Use(corsMiddleware(cfg.CORSOrigin))

	// Public: status
	statusH := handler.NewStatusHandler(client)
	r.Get("/api/v1/status", statusH.GetStatus)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware(cfg.APIKey))

		configH := handler.NewConfigHandler(configRepo)
		r.Get("/api/v1/config", configH.GetConfig)
		r.Put("/api/v1/config", configH.SetConfig)

		sender := bot.NewSender(client)
		groupsH := handler.NewGroupsHandler(groupRepo, configRepo, sender)

		r.Get("/api/v1/groups", groupsH.List)
		r.Get("/api/v1/groups/{jid}", groupsH.Get)
		r.Put("/api/v1/groups/{jid}/permissions", groupsH.SetPermissions)
		r.Put("/api/v1/groups/{jid}/config", groupsH.SetConfig)
		r.Post("/api/v1/groups/{jid}/messages", groupsH.SendMessage)
	})

	return &Server{
		cfg: cfg,
		httpServer: &http.Server{
			Addr:    cfg.APIAddr,
			Handler: r,
		},
	}
}

// ListenAndServe starts the HTTP server and blocks until ctx is cancelled,
// then performs a graceful shutdown.
func (s *Server) ListenAndServe(ctx context.Context) error {
	errCh := make(chan error, 1)
	go func() {
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		return s.httpServer.Shutdown(context.Background())
	}
}

// authMiddleware validates the static Bearer token.
func authMiddleware(apiKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if apiKey == "" {
				// No key configured — allow all (dev/local mode).
				next.ServeHTTP(w, r)
				return
			}
			token := r.Header.Get("Authorization")
			const prefix = "Bearer "
			if len(token) <= len(prefix) {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			token = token[len(prefix):]
			if subtle.ConstantTimeCompare([]byte(token), []byte(apiKey)) != 1 {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// corsMiddleware adds CORS headers allowing the configured origin.
func corsMiddleware(origin string) func(http.Handler) http.Handler {
	if origin == "" {
		origin = "*"
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
