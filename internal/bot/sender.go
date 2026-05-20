package bot

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
)

// Ensure WhatsAppSender satisfies the sender.MessageSender interface.
var _ sender.MessageSender = (*WhatsAppSender)(nil)

// WhatsAppSender is the production implementation backed by *whatsmeow.Client.
type WhatsAppSender struct {
	client *whatsmeow.Client
}

// NewSender creates a WhatsAppSender wrapping the given client.
func NewSender(client *whatsmeow.Client) *WhatsAppSender {
	return &WhatsAppSender{client: client}
}

func (s *WhatsAppSender) SendText(ctx context.Context, to types.JID, text string) error {
	_, err := s.client.SendMessage(ctx, to, &waProto.Message{
		Conversation: proto.String(text),
	})
	return err
}

func (s *WhatsAppSender) SendImage(ctx context.Context, to types.JID, imageBytes []byte, caption string) error {
	resp, err := s.client.Upload(ctx, imageBytes, whatsmeow.MediaImage)
	if err != nil {
		return fmt.Errorf("upload image: %w", err)
	}
	_, err = s.client.SendMessage(ctx, to, &waProto.Message{
		ImageMessage: &waProto.ImageMessage{
			URL:           proto.String(resp.URL),
			Mimetype:      proto.String("image/jpeg"),
			Caption:       proto.String(caption),
			MediaKey:      resp.MediaKey,
			FileEncSHA256: resp.FileEncSHA256,
			FileSHA256:    resp.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(imageBytes))),
		},
	})
	return err
}

func (s *WhatsAppSender) SendAudio(ctx context.Context, to types.JID, audioBytes []byte, mime string) error {
	resp, err := s.client.Upload(ctx, audioBytes, whatsmeow.MediaAudio)
	if err != nil {
		return fmt.Errorf("upload audio: %w", err)
	}
	_, err = s.client.SendMessage(ctx, to, &waProto.Message{
		AudioMessage: &waProto.AudioMessage{
			URL:           proto.String(resp.URL),
			Mimetype:      proto.String(mime),
			MediaKey:      resp.MediaKey,
			FileEncSHA256: resp.FileEncSHA256,
			FileSHA256:    resp.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(audioBytes))),
			PTT:           proto.Bool(false),
		},
	})
	return err
}

func (s *WhatsAppSender) SendSticker(ctx context.Context, to types.JID, stickerBytes []byte) error {
	resp, err := s.client.Upload(ctx, stickerBytes, whatsmeow.MediaImage)
	if err != nil {
		return fmt.Errorf("upload sticker: %w", err)
	}
	_, err = s.client.SendMessage(ctx, to, &waProto.Message{
		StickerMessage: &waProto.StickerMessage{
			URL:           proto.String(resp.URL),
			Mimetype:      proto.String("image/webp"),
			MediaKey:      resp.MediaKey,
			FileEncSHA256: resp.FileEncSHA256,
			FileSHA256:    resp.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(stickerBytes))),
		},
	})
	return err
}

func (s *WhatsAppSender) SendPoll(ctx context.Context, to types.JID, question string, options []string) error {
	pollMsg := s.client.BuildPollCreation(question, options, 1)
	_, err := s.client.SendMessage(ctx, to, pollMsg)
	return err
}

func (s *WhatsAppSender) SendDocument(ctx context.Context, to types.JID, data []byte, filename, mime string) error {
	resp, err := s.client.Upload(ctx, data, whatsmeow.MediaDocument)
	if err != nil {
		return fmt.Errorf("upload document: %w", err)
	}
	_, err = s.client.SendMessage(ctx, to, &waProto.Message{
		DocumentMessage: &waProto.DocumentMessage{
			URL:           proto.String(resp.URL),
			Mimetype:      proto.String(mime),
			Title:         proto.String(filename),
			FileName:      proto.String(filename),
			MediaKey:      resp.MediaKey,
			FileEncSHA256: resp.FileEncSHA256,
			FileSHA256:    resp.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(data))),
		},
	})
	return err
}

func (s *WhatsAppSender) SendTextMention(ctx context.Context, to types.JID, text string, mentions []string) error {
	_, err := s.client.SendMessage(ctx, to, &waProto.Message{
		ExtendedTextMessage: &waProto.ExtendedTextMessage{
			Text: proto.String(text),
			ContextInfo: &waProto.ContextInfo{
				MentionedJID: mentions,
			},
		},
	})
	return err
}

func (s *WhatsAppSender) SetTyping(ctx context.Context, chat types.JID, typing bool) {
	presence := types.ChatPresenceComposing
	if !typing {
		presence = types.ChatPresencePaused
	}
	_ = s.client.SendChatPresence(ctx, chat, presence, types.ChatPresenceMediaText)
}
