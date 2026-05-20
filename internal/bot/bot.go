package bot

import (
	"context"
	"fmt"
	"os"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"github.com/mdp/qrterminal/v3"

	"github.com/leleuvilela/leniser-wpp/internal/command"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

const (
	maxReconnectInterval = 5 * time.Minute
	initialBackoff       = 5 * time.Second
)

// EventHandler is a callback compatible with whatsmeow.AddEventHandler.
type EventHandler = whatsmeow.EventHandler

// Bot ties together the whatsmeow client, command registry, and all repos.
type Bot struct {
	client          *whatsmeow.Client
	dispatcher      *Dispatcher
	extraHandlers   []EventHandler
}

// New creates a Bot wired with all dependencies.
func New(
	client *whatsmeow.Client,
	registry *command.Registry,
	groupRepo storage.GroupRepo,
	msgRepo storage.MessageRepo,
) *Bot {
	var botJID types.JID
	if client.Store.ID != nil {
		botJID = client.Store.ID.ToNonAD()
	}
	dispatcher := NewDispatcher(registry, groupRepo, msgRepo, botJID)
	return &Bot{
		client:     client,
		dispatcher: dispatcher,
	}
}

// AddEventHandler registers an additional raw event handler (e.g. group-join listener).
func (b *Bot) AddEventHandler(h EventHandler) {
	b.extraHandlers = append(b.extraHandlers, h)
}

// Start connects the bot to WhatsApp and blocks until ctx is cancelled.
// On disconnection it will attempt to reconnect with exponential backoff up to
// maxReconnectInterval (SC-012: reconnect ≤ 5 min).
func (b *Bot) Start(ctx context.Context) error {
	b.client.AddEventHandler(b.dispatcher.HandleEvent)
	for _, h := range b.extraHandlers {
		b.client.AddEventHandler(h)
	}

	if err := b.connect(ctx); err != nil {
		return err
	}

	// Monitor for disconnection and reconnect automatically.
	reconnectCh := make(chan struct{}, 1)

	b.client.AddEventHandler(func(rawEvt interface{}) {
		if _, ok := rawEvt.(*events.Disconnected); ok {
			select {
			case reconnectCh <- struct{}{}:
			default:
			}
		}
	})

	backoff := initialBackoff
	for {
		select {
		case <-ctx.Done():
			b.client.Disconnect()
			return ctx.Err()
		case <-reconnectCh:
			fmt.Fprintln(os.Stderr, "[bot] disconnected — attempting reconnect")
			for {
				select {
				case <-ctx.Done():
					return ctx.Err()
				default:
				}
				if err := b.connect(ctx); err == nil {
					fmt.Fprintln(os.Stderr, "[bot] reconnected successfully")
					backoff = initialBackoff // reset
					break
				}
				fmt.Fprintf(os.Stderr, "[bot] reconnect failed, retrying in %s\n", backoff)
				select {
				case <-ctx.Done():
					return ctx.Err()
				case <-time.After(backoff):
				}
				backoff = min(backoff*2, maxReconnectInterval)
			}
		}
	}
}

func (b *Bot) connect(ctx context.Context) error {
	if b.client.Store.ID == nil {
		// First-time pairing: display QR code in terminal.
		qrChan, _ := b.client.GetQRChannel(ctx)
		if err := b.client.Connect(); err != nil {
			return fmt.Errorf("connect: %w", err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stderr)
			} else {
				fmt.Fprintf(os.Stderr, "[bot] QR event: %s\n", evt.Event)
			}
		}
		return nil
	}
	return b.client.Connect()
}

func min(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}
