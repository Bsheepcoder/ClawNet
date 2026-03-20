# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-03-20

### Major Changes
- 🎉 **Complete CLI overhaul** - Inspired by OpenClaw and OpenCode design
- 🎮 **Dual mode support** - Traditional CLI + Interactive CLI
- 📦 **Command grouping** - node/relation/config commands
- ⚡ **Global options** - --url, --token, --json, --no-color
- 🎨 **ASCII Art banner** - Professional look with figlet
- 🔧 **Configuration persistence** - Auto-save to ~/.clawnetrc

### New Commands
- `clawnet init` - Initialize configuration
- `clawnet quick` - Quick actions menu
- `clawnet docs` - Open documentation
- `clawnet config` - Configuration management
- `clawnet interactive` (alias: `i`) - Interactive mode

### Command Aliases
- `nodes` = `node`
- `node ls` = `node list`
- `node rm` = `node delete`
- `relations` = `relation`
- `relation ls` = `relation list`
- `i` = `interactive`

### Enhanced Features
- ✅ Colored output with chalk
- ✅ Progress spinners with ora
- ✅ Better error messages
- ✅ Confirmation dialogs
- ✅ JSON output support
- ✅ Grouped menus in interactive mode

### Dependencies
- figlet: ^1.7.0 (ASCII Art)

### Documentation
- CLI-UPGRADE.md - Detailed upgrade guide
- Updated CLI-GUIDE.md with new commands

### Breaking Changes
- Command structure changed to grouped format
- Old flat commands still work but deprecated

## [0.5.3] - 2026-03-20

### Added
- 🎉 **Interactive CLI** (clawnet-interactive)
  - Menu-based user interface
  - Colored output with chalk
  - Progress spinners with ora
  - User-friendly prompts with inquirer
- 🔧 **Configuration management**
  - Auto-save configuration to ~/.clawnetrc
  - Cross-session persistence
- 📦 **Node export/import**
  - Export nodes to JSON
  - Import nodes in batch
- ⏱️ **Temporary relations (TTL) UI**
  - Interactive TTL creation
  - Expiration warnings
- 🎨 **Enhanced UX**
  - Node grouping by type
  - Colored status indicators
  - Confirmation dialogs
  - Progress feedback

### Dependencies
- chalk: ^4.1.2 (colored output)
- commander: ^12.0.0 (CLI framework)
- inquirer: ^9.2.0 (interactive prompts)
- ora: ^7.0.0 (progress spinners)

### Documentation
- Add CLI-GUIDE.md with detailed usage
- Update README with CLI tools section

### Fixed
- Improved error handling
- Better error messages

## [0.5.2] - 2026-03-20

### Fixed
- Package metadata corrections

## [0.5.1] - 2026-03-20

### Added
- 📝 **English documentation** (default language)
- 🇨🇳 **Chinese documentation** (README_CN.md)
- 📦 **npm badges** in README
- 🪟 **Windows installation guide** (INSTALL_WINDOWS.md)
- 🔗 **Features documentation** (FEATURES.md)

### Changed
- Repository URL: https://github.com/Bsheepcoder/ClawNet
- Default README language: English
- Improved package.json metadata

## [0.5.0] - 2026-03-20

### Added
- 🎉 **First npm release**
- 📦 Multi-platform adapters (WeChat, Telegram)
- 📦 Relation graph management
- 📦 Permission control system
- 📦 WebSocket real-time communication
- 📦 SQLite local storage
- 📦 Extensible plugin system
- 📦 CLI tools
- 📦 OpenClaw skill integration
- 📚 Complete README documentation
- 📚 MIT LICENSE
- 📚 CHANGELOG.md

### Security
- 🔒 Removed all sensitive credentials
- 🔒 Added .gitignore for user configs
- 🔒 Added .env.example templates
- 🔒 No hardcoded credentials

### Improvements
- 📝 Comprehensive documentation
- 📝 Clean codebase
- 📝 Easy to use API
- 📝 Full TypeScript support

### Technical Details
- ✅ 51 files included
- ✅ 130.9 KB unpacked size
- ✅ 33.0 KB package size
- ✅ Full TypeScript definitions
- ✅ MIT License

## [0.4.1] - 2026-03-17

### Fixed
- Bug fixes and performance improvements
- Minor UI improvements

## [0.4.0] - 2026-03-16

### Added
- WeChat integration
- Message storage
- Auto-reply feature

## [0.3.0] - 2026-03-14

### Added
- Initial MVP release
- Basic routing system
- Permission management
- Graph structure

---

## Release Links

- [v0.5.0](https://github.com/Bsheepcoder/ClawNet/releases/tag/v0.5.0) - First npm release
- [v0.4.1](https://github.com/Bsheepcoder/ClawNet/releases/tag/v0.4.1) - Bug fixes
- [v0.4.0](https://github.com/Bsheepcoder/ClawNet/releases/tag/v0.4.0) - WeChat integration
- [v0.3.0](https://github.com/Bsheepcoder/ClawNet/releases/tag/v0.3.0) - Initial release

---

**For more details, see the [GitHub Releases](https://github.com/Bsheepcoder/ClawNet/releases) page.**
