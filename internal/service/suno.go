package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const sunoTimeout = 5 * time.Minute

// SunoService wraps the Suno music-generation API.
type SunoService struct {
	apiURL string
	client *http.Client
}

// NewSunoService creates a SunoService.
func NewSunoService(apiURL string) *SunoService {
	return &SunoService{
		apiURL: apiURL,
		client: &http.Client{},
	}
}

// Generate creates a music track for the given prompt and returns its audio bytes.
// FR-025: fail-fast, no retries.
func (s *SunoService) Generate(ctx context.Context, prompt string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, sunoTimeout)
	defer cancel()

	body, _ := json.Marshal(map[string]interface{}{
		"prompt":           prompt,
		"wait_audio":       true,
		"make_instrumental": false,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.apiURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("suno: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("suno: request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("suno: status %d: %s", resp.StatusCode, b)
	}

	// Response may be an array or single object; handle both.
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("suno: read body: %w", err)
	}

	// Try array first
	var arr []struct {
		AudioURL string `json:"audio_url"`
	}
	if jerr := json.Unmarshal(raw, &arr); jerr == nil && len(arr) > 0 && arr[0].AudioURL != "" {
		return s.downloadAudio(ctx, arr[0].AudioURL)
	}

	// Try single object
	var obj struct {
		AudioURL string `json:"audio_url"`
	}
	if jerr := json.Unmarshal(raw, &obj); jerr == nil && obj.AudioURL != "" {
		return s.downloadAudio(ctx, obj.AudioURL)
	}

	return nil, fmt.Errorf("suno: no audio_url in response")
}

func (s *SunoService) downloadAudio(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("suno: download build request: %w", err)
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("suno: download: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("suno: download status %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}
