# openclaw-pass-manager

[![npm version](https://img.shields.io/npm/v/openclaw-pass-manager)](https://www.npmjs.com/package/openclaw-pass-manager)
[![npm downloads](https://img.shields.io/npm/dm/openclaw-pass-manager)](https://www.npmjs.com/package/openclaw-pass-manager)

OpenClaw plugin for the standard Unix password manager (`pass`).

It exposes tools for listing entries, reading entries, saving/updating entries, searching by name or content, and generating OTP codes through `pass-otp`.

## Features

- Uses your existing `pass` store and GPG setup
- Supports full or partial entry names for `pass_get` and `pass_otp`
- Supports generated passwords or multiline manual entry creation
- Includes optional OTP tool integration (`pass-otp`)
- Defends against path traversal and unsafe input sizes

## Installation

Install with OpenClaw:

```bash
openclaw plugins install openclaw-pass-manager
```

Or install with npm:

```bash
npm install openclaw-pass-manager
```

Restart the OpenClaw gateway after installation.

## Requirements

- Node.js 20+
- `pass` 1.7+
- `gpg`
- Optional: `pass-otp` for OTP support

You should already have an initialized password store, for example:

```bash
pass init "<your-gpg-key-id>"
```

## Configuration

By default, the plugin reads from:

- `config.storePath` (if set), otherwise
- `$PASSWORD_STORE_DIR` (if set), otherwise
- `~/.password-store`

Example `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openclaw-pass-manager": {
        "enabled": true,
        "config": {
          "storePath": "/home/you/.password-store"
        }
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `pass_list` | List store entries, optionally within a subfolder |
| `pass_get` | Retrieve an entry by full or partial name, optionally by line number |
| `pass_save` | Insert/overwrite an entry or generate a new password |
| `pass_search` | Search entry names (`pass find`) or contents (`pass grep`) |
| `pass_otp` | Generate OTP code or append an `otpauth://` URI (requires `pass-otp`) |

## Usage Examples

Use prompts like:

- `List passwords under Work/Services.`
- `Get the password for github.`
- `Save entry Work/vpn with password on first line and notes below it.`
- `Generate a 32-character password for Email/protonmail and overwrite if it exists.`
- `Search password entries for "aws".`
- `Generate OTP for gmail.`

## Development

```bash
npm test
npm run lint
```

## License

MIT
