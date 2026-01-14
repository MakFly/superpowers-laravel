# Superpowers Laravel

A Laravel 12 focused toolkit for Claude Code providing Actions architecture, Pest testing, Eloquent patterns, queues, caching, validation, and API resources.

## Installation

```bash
claude plugins add superpowers-laravel
```

### Manual install (git clone)

```bash
git clone https://github.com/MakFly/superpowers-laravel.git ~/.claude/plugins/superpowers-laravel
```

Enable the plugin in both configs (Claude + GLM):

```json
// ~/.claude/settings.json
{
  "enabledPlugins": {
    "superpowers-laravel@custom": true
  }
}
```

```json
// ~/.claude-glm/.claude.json
{
  "enabledPlugins": {
    "superpowers-laravel@custom": true
  }
}
```

Restart Claude Code.

### Fallback: symlink skills (if plugin skills don’t load)

```bash
ln -s ~/.claude/plugins/superpowers-laravel/skills/migrations ~/.claude/skills/laravel-migrations
```

Then call:
```
Use the skill laravel:migrations
```

### Troubleshooting (Unknown skill)

If you see `Unknown skill`:
1. Restart Claude Code.
2. Run `What skills are available?` to confirm the plugin is loaded.
3. Ensure `enabledPlugins` includes `superpowers-laravel@custom` in both configs.
4. Use the fallback symlink if the plugin still does not expose skills.
