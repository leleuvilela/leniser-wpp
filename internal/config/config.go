package config

import "os"

// Config holds all runtime configuration loaded from environment variables.
type Config struct {
	DBPath          string
	APIAddr         string
	APIKey          string
	CORSOrigin      string
	OpenAIAPIKey    string
	SunoAPIURL      string
	ImgflipUsername string
	ImgflipPassword string
	LogLevel        string
	AppEnv          string
}

// Load reads configuration from environment variables and applies defaults.
func Load() Config {
	return Config{
		DBPath:          getEnv("BOT_DB_PATH", "./bot.db"),
		APIAddr:         getEnv("BOT_API_ADDR", ":8080"),
		APIKey:          getEnv("BOT_API_KEY", ""),
		CORSOrigin:      getEnv("BOT_CORS_ORIGIN", "*"),
		OpenAIAPIKey:    getEnv("OPENAI_API_KEY", ""),
		SunoAPIURL:      getEnv("SUNO_API_URL", "https://sunoapi-eight.vercel.app/api/generate"),
		ImgflipUsername: getEnv("IMGFLIP_USERNAME", ""),
		ImgflipPassword: getEnv("IMGFLIP_PASSWORD", ""),
		LogLevel:        getEnv("LOG_LEVEL", "info"),
		AppEnv:          getEnv("APP_ENV", "production"),
	}
}

// IsLocal returns true when running in local/development mode.
func (c Config) IsLocal() bool {
	return c.AppEnv == "local" || c.AppEnv == "development"
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
