package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const (
	imgflipBaseURL = "https://api.imgflip.com"
	imgflipTimeout = 30 * time.Second
)

// ImgflipService wraps the Imgflip meme API.
type ImgflipService struct {
	username string
	password string
	client   *http.Client
}

// NewImgflipService creates an ImgflipService.
func NewImgflipService(username, password string) *ImgflipService {
	return &ImgflipService{
		username: username,
		password: password,
		client:   &http.Client{},
	}
}

// SearchMeme searches for a meme matching query and returns the image bytes.
// FR-025: fail-fast, no retries.
func (s *ImgflipService) SearchMeme(ctx context.Context, query string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, imgflipTimeout)
	defer cancel()

	params := url.Values{}
	params.Set("username", s.username)
	params.Set("password", s.password)
	params.Set("query", query)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		imgflipBaseURL+"/search_memes?"+params.Encode(), nil)
	if err != nil {
		return nil, fmt.Errorf("imgflip search: build request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("imgflip search: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
		Data    struct {
			Memes []struct {
				URL string `json:"url"`
			} `json:"memes"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("imgflip search: decode: %w", err)
	}
	if !result.Success || len(result.Data.Memes) == 0 {
		return nil, fmt.Errorf("imgflip search: no memes found for %q", query)
	}

	return s.downloadImage(ctx, result.Data.Memes[0].URL)
}

// AIMeme generates an AI meme with the given prompt and returns image bytes.
func (s *ImgflipService) AIMeme(ctx context.Context, prompt string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, imgflipTimeout)
	defer cancel()

	body := url.Values{}
	body.Set("username", s.username)
	body.Set("password", s.password)
	body.Set("prefix_text", prompt)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		imgflipBaseURL+"/ai_meme", bytes.NewBufferString(body.Encode()))
	if err != nil {
		return nil, fmt.Errorf("imgflip aimeme: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("imgflip aimeme: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
		Data    struct {
			URL string `json:"url"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("imgflip aimeme: decode: %w", err)
	}
	if !result.Success || result.Data.URL == "" {
		return nil, fmt.Errorf("imgflip aimeme: no image returned")
	}

	return s.downloadImage(ctx, result.Data.URL)
}

func (s *ImgflipService) downloadImage(ctx context.Context, imgURL string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imgURL, nil)
	if err != nil {
		return nil, fmt.Errorf("imgflip download: %w", err)
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("imgflip download: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("imgflip download: status %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}
