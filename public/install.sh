#!/bin/bash
OS="$(uname -s)"
INSTALL_DIR="$HOME/.cyberremote"

# Direct URL to the raw compiled binary on GitHub Releases
BINARY_URL="https://github.com/sameer-softengs/keys/releases/latest/download/cyberremote-linux"

mkdir -p "$INSTALL_DIR"

if [ "$OS" = "Linux" ]; then
    echo "Downloading CyberRemote Pro for Linux..."
    curl -sSL -L "$BINARY_URL" -o "$INSTALL_DIR/cyberremote"
elif [ "$OS" = "Darwin" ]; then
    echo "Downloading CyberRemote Pro for macOS..."
    curl -sSL -L "https://github.com/sameer-softengs/keys/releases/latest/download/cyberremote-macos" -o "$INSTALL_DIR/cyberremote"
fi

# Ensure executable permissions
chmod +x "$INSTALL_DIR/cyberremote"

# Configure Autostart for Linux
if [ "$OS" = "Linux" ]; then
    mkdir -p ~/.config/autostart
    cat << AUTOSTART > ~/.config/autostart/cyberremote.desktop
[Desktop Entry]
Type=Application
Name=CyberRemote Pro
Exec=$INSTALL_DIR/cyberremote
Hidden=false
X-GNOME-Autostart-enabled=true
AUTOSTART
    chmod +x ~/.config/autostart/cyberremote.desktop
fi

echo "Installation complete! Launching CyberRemote Pro..."
"$INSTALL_DIR/cyberremote" &
