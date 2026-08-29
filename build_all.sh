#!/bin/bash
mkdir -p dist/bin

echo "Building Linux binary..."
CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o dist/bin/cyberremote-linux main.go

echo "Building Windows binary..."
CGO_ENABLED=1 GOOS=windows GOARCH=amd64 CC=x86_64-w64-mingw32-gcc CXX=x86_64-w64-mingw32-g++ go build -ldflags="-s -w" -o dist/bin/cyberremote-windows.exe main.go

echo "Build complete! Check dist/bin/"
