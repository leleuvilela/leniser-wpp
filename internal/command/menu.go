package command

import (
	"context"
	"strings"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

const menuText = `🤖 *Comandos disponíveis*

*Básico*
!ping — verifica se o bot está online
!menu — exibe este menu

*IA*
!bot <pergunta> — responde com IA (GPT-4o)
!imagem <prompt> — gera uma imagem com IA
!fala <texto> — converte texto em áudio
!transcrever — transcreve áudio (responda a um áudio)
!resumo [N] — resume as últimas N mensagens

*Estatísticas*
!ranking [dia|semana|mes] [graph] — ranking de mensagens
!msgsdia — mensagens por dia

*Mídia*
!sticker — converte imagem/vídeo em sticker
!mp3 [nome] — converte áudio/vídeo para MP3

*Memes*
!meme <busca> — busca um meme
!aimeme <prompt> — gera meme com IA

*Música*
!musica <prompt> — gera uma música com IA

*Enquetes*
!checagem — enquete de checagem
!vainele — enquete "vai nele"

*Utilitários*
!aa — informações sobre o AA`

// MenuHandler displays the command list.
type MenuHandler struct {
	sender sender.MessageSender
}

// NewMenuHandler creates a MenuHandler.
func NewMenuHandler(s sender.MessageSender) *MenuHandler {
	return &MenuHandler{sender: s}
}

func (h *MenuHandler) Name() string               { return "menu" }
func (h *MenuHandler) BypassPermissionGate() bool { return false }

func (h *MenuHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.TrimSpace(getBody(evt)) == "!menu"
}

func (h *MenuHandler) Handle(ctx context.Context, evt *events.Message, _ *storage.Group) error {
	return h.sender.SendText(ctx, evt.Info.Chat, menuText)
}
