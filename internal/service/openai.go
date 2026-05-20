// Package service provides clients for external AI and media services.
package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

const (
	openAIBaseURL     = "https://api.openai.com/v1"
	chatTimeout       = 60 * time.Second
	transcribeTimeout = 60 * time.Second
	imageTimeout      = 60 * time.Second
	ttsTimeout        = 60 * time.Second
)

// ChatMessage is a single turn in a conversation.
type ChatMessage struct {
	Role    string // "user" | "assistant" | "system"
	Content string
}

// OpenAIService wraps the OpenAI REST API.
type OpenAIService struct {
	apiKey string
	client *http.Client
}

// NewOpenAIService creates an OpenAIService.
func NewOpenAIService(apiKey string) *OpenAIService {
	return &OpenAIService{
		apiKey: apiKey,
		client: &http.Client{},
	}
}

// Chat sends a chat completion request to gpt-4o and returns the reply text.
// FR-025: no retries; fail-fast on any error.
func (s *OpenAIService) Chat(ctx context.Context, systemPrompt string, messages []ChatMessage) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, chatTimeout)
	defer cancel()

	type msgPayload struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}

	msgs := make([]msgPayload, 0, len(messages)+1)
	if systemPrompt != "" {
		msgs = append(msgs, msgPayload{Role: "system", Content: systemPrompt})
	}
	for _, m := range messages {
		msgs = append(msgs, msgPayload{Role: m.Role, Content: m.Content})
	}

	body, _ := json.Marshal(map[string]interface{}{
		"model":    "gpt-4o",
		"messages": msgs,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIBaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("openai chat: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai chat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai chat: status %d: %s", resp.StatusCode, b)
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("openai chat: decode: %w", err)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("openai chat: no choices returned")
	}
	return result.Choices[0].Message.Content, nil
}

// Transcribe sends audio bytes to Whisper and returns the transcription text.
func (s *OpenAIService) Transcribe(ctx context.Context, audioBytes []byte) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, transcribeTimeout)
	defer cancel()

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	_ = mw.WriteField("model", "whisper-1")
	fw, err := mw.CreateFormFile("file", "audio.ogg")
	if err != nil {
		return "", fmt.Errorf("openai transcribe: create form file: %w", err)
	}
	if _, err := fw.Write(audioBytes); err != nil {
		return "", fmt.Errorf("openai transcribe: write bytes: %w", err)
	}
	_ = mw.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIBaseURL+"/audio/transcriptions", &buf)
	if err != nil {
		return "", fmt.Errorf("openai transcribe: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai transcribe: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai transcribe: status %d: %s", resp.StatusCode, b)
	}

	var result struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("openai transcribe: decode: %w", err)
	}
	return result.Text, nil
}

// GenerateImage calls gpt-image-1 and returns raw PNG/JPEG bytes.
func (s *OpenAIService) GenerateImage(ctx context.Context, prompt string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, imageTimeout)
	defer cancel()

	body, _ := json.Marshal(map[string]interface{}{
		"model":           "gpt-image-1",
		"prompt":          prompt,
		"n":               1,
		"size":            "1024x1024",
		"response_format": "b64_json",
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIBaseURL+"/images/generations", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("openai image: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openai image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("openai image: status %d: %s", resp.StatusCode, b)
	}

	var result struct {
		Data []struct {
			B64JSON string `json:"b64_json"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("openai image: decode: %w", err)
	}
	if len(result.Data) == 0 || result.Data[0].B64JSON == "" {
		return nil, fmt.Errorf("openai image: no image returned")
	}
	imgBytes, err := base64.StdEncoding.DecodeString(result.Data[0].B64JSON)
	if err != nil {
		return nil, fmt.Errorf("openai image: decode b64: %w", err)
	}
	return imgBytes, nil
}

// TextToSpeech converts text to speech using tts-1 (voice: onyx) and returns MP3 bytes.
func (s *OpenAIService) TextToSpeech(ctx context.Context, text string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, ttsTimeout)
	defer cancel()

	body, _ := json.Marshal(map[string]interface{}{
		"model":  "tts-1",
		"input":  text,
		"voice":  "onyx",
		"format": "mp3",
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIBaseURL+"/audio/speech", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("openai tts: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openai tts: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("openai tts: status %d: %s", resp.StatusCode, b)
	}

	return io.ReadAll(resp.Body)
}
