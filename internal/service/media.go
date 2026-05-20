package service

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
)

// ConvertToMP3 converts input audio/video bytes to MP3 using ffmpeg.
// FR-025: fail-fast on ffmpeg error.
func ConvertToMP3(ctx context.Context, inputBytes []byte, inputMIME string) ([]byte, error) {
	// Determine input extension from MIME
	ext := mimeToExt(inputMIME)

	// Write input to a temp file
	inFile, err := os.CreateTemp("", "leniser-in-*"+ext)
	if err != nil {
		return nil, fmt.Errorf("media convert: create input temp: %w", err)
	}
	defer os.Remove(inFile.Name())
	if _, err := inFile.Write(inputBytes); err != nil {
		inFile.Close()
		return nil, fmt.Errorf("media convert: write input: %w", err)
	}
	inFile.Close()

	// Create output temp file
	outFile, err := os.CreateTemp("", "leniser-out-*.mp3")
	if err != nil {
		return nil, fmt.Errorf("media convert: create output temp: %w", err)
	}
	outFile.Close()
	defer os.Remove(outFile.Name())

	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-y",            // overwrite without asking
		"-i", inFile.Name(),
		"-f", "mp3",
		"-vn",           // no video
		outFile.Name(),
	)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("media convert: ffmpeg: %w — %s", err, stderr.String())
	}

	return os.ReadFile(outFile.Name())
}

func mimeToExt(mime string) string {
	switch mime {
	case "audio/ogg", "audio/ogg; codecs=opus":
		return ".ogg"
	case "audio/mpeg", "audio/mp3":
		return ".mp3"
	case "audio/mp4", "audio/m4a":
		return ".m4a"
	case "audio/wav":
		return ".wav"
	case "video/mp4":
		return ".mp4"
	case "video/webm":
		return ".webm"
	default:
		return ".bin"
	}
}
