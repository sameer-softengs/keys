#!/bin/bash

OS="$(uname -s)"
INSTALL_DIR="$HOME/.cyberremote"

# Change this to your deployed domain or Vercel URL
BASE_URL="http://yourdomain.com"

mkdir -p "$INSTALL_DIR"

if [ "$OS" = "Linux" ]; then
    echo "Downloading CyberRemote Pro for Linux..."
    curl -sSL "$BASE_URL/bin/cyberremote-linux" -o "$INSTALL_DIR/cyberremote"
elif [ "$OS" = "Darwin" ]; then
    echo "Downloading CyberRemote Pro for macOS..."
    curl -sSL "$BASE_URL/bin/cyberremote-macos" -o "$INSTALL_DIR/cyberremote"
else
    echo "Unsupported operating system."
    exit 1
fi

chmod +x "$INSTALL_DIR/cyberremote"

# Create Autostart entry for Linux
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

echo "Installation complete! Starting CyberRemote Pro..."
"$INSTALL_DIR/cyberremote" &
