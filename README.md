# Keys

A Go-based application for working with key-oriented functionality and a lightweight web-facing interface.

## Overview

This project provides a structured Go codebase with build scripts, dependency management, and public assets for development and deployment workflows.

## Technology

- Go
- Go modules
- Shell build scripts
- Web assets

## Getting Started

### Prerequisites

- Go 1.20+
- Bash-compatible shell for the build scripts

### Setup

```bash
git clone https://github.com/sameer-softengs/keys.git
cd keys
go mod download
go run .
```

### Build

```bash
./build.sh
```

Use `build_all.sh` when you need to build all supported targets defined by the repository.

## Development

Keep generated artifacts out of version control and use the existing `.gitignore` configuration. Run formatting and tests before submitting changes.

## License

See the repository for licensing details.
