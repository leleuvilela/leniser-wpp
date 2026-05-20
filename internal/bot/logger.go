package bot

import (
	"encoding/json"
	"fmt"
	"os"
)

// EventLog is the structured log entry emitted per handled event (FR-024).
type EventLog struct {
	CorrelationID string `json:"correlation_id"`
	HandlerName   string `json:"handler_name"`
	Outcome       string `json:"outcome"` // "ok" | "error" | "panic" | "ignored"
	LatencyMs     int64  `json:"latency_ms"`
	Error         string `json:"error,omitempty"`
}

// LogEvent writes a JSON-encoded EventLog to stdout.
func LogEvent(e EventLog) {
	b, _ := json.Marshal(e)
	fmt.Fprintln(os.Stdout, string(b))
}
