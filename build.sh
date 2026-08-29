#!/bin/bash

echo "Tidying modules..."
go mod tidy

echo "Building Native Executable (< 2 MB)..."
CGO_ENABLED=1 go build -ldflags="-s -w" -o dist/MouseRemote_linux main.go

echo "Build complete! Output saved to dist/MouseRemote_linux"
