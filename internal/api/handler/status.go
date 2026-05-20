package handler

import (
	"encoding/json"
	"net/http"

	"go.mau.fi/whatsmeow"
)

// StatusHandler serves GET /api/v1/status (no auth required).
type StatusHandler struct {
	client *whatsmeow.Client
}

// NewStatusHandler creates a StatusHandler.
func NewStatusHandler(client *whatsmeow.Client) *StatusHandler {
	return &StatusHandler{client: client}
}

type statusResponse struct {
	Connected bool   `json:"connected"`
	Phone     string `json:"phone,omitempty"`
}

// GetStatus returns WhatsApp connection state.
func (h *StatusHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	resp := statusResponse{
		Connected: h.client.IsConnected(),
	}
	if h.client.Store.ID != nil {
		resp.Phone = h.client.Store.ID.User
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
