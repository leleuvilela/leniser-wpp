package storage

// ResolveConfig merges global defaults with per-group overrides.
// A nil override (or nil pointer field) means "use global default".
func ResolveConfig(global Config, override *GroupConfig) Config {
	if override == nil {
		return global
	}
	out := global
	if override.BotPrefix != nil {
		out.BotPrefix = *override.BotPrefix
	}
	if override.SystemPrompt != nil {
		out.SystemPrompt = *override.SystemPrompt
	}
	if override.ImageCooldownEnabled != nil {
		out.ImageCooldownEnabled = *override.ImageCooldownEnabled
	}
	if override.ImageCooldownMinutes != nil {
		out.ImageCooldownMinutes = *override.ImageCooldownMinutes
	}
	return out
}
