#!/bin/bash
OS="$(uname -s)"
INSTALL_DIR="$HOME/.cyberremote"
BASE_URL="http://wscodework.me/keys"

mkdir -p "$INSTALL_DIR"

if [ "$OS" = "Linux" ]; then
    echo "Downloading CyberRemote Pro for Linux..."
    curl -sSL "$BASE_URL/bin/cyberremote-linux" -o "$INSTALL_DIR/cyberremote"
elif [ "$OS" = "Darwin" ]; then
    echo "Downloading CyberRemote Pro for macOS..."
    curl -sSL "$BASE_URL/bin/cyberremote-macos" -o "$INSTALL_DIR/cyberremote"
fi

chmod +x "$INSTALL_DIR/cyberremote"
echo "Installation complete! Launching..."
"$INSTALL_DIR/cyberremote" &
