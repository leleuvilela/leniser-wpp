// Package sender defines the MessageSender interface used by command handlers
// to send WhatsApp messages without depending on the bot package.
package sender

import (
	"context"

	"go.mau.fi/whatsmeow/types"
)

// MessageSender abstracts all outbound WhatsApp message operations.
type MessageSender interface {
	SendText(ctx context.Context, to types.JID, text string) error
	SendImage(ctx context.Context, to types.JID, imageBytes []byte, caption string) error
	SendAudio(ctx context.Context, to types.JID, audioBytes []byte, mime string) error
	SendSticker(ctx context.Context, to types.JID, stickerBytes []byte) error
	SendPoll(ctx context.Context, to types.JID, question string, options []string) error
	SendDocument(ctx context.Context, to types.JID, data []byte, filename, mime string) error
	SendTextMention(ctx context.Context, to types.JID, text string, mentions []string) error
	SetTyping(ctx context.Context, chat types.JID, typing bool)
}
