package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"sync"

	"github.com/go-vgo/robotgo"
	"github.com/gorilla/websocket"
	"github.com/skip2/go-qrcode"
)

//go:embed public/*
var content embed.FS

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var (
	activeConn *websocket.Conn
	connMutex  sync.Mutex
)

type InputMessage struct {
	Type      string   `json:"type"`
	Dx        float64  `json:"dx"`
	Dy        float64  `json:"dy"`
	Button    string   `json:"button"`
	Key       string   `json:"key"`
	Modifiers []string `json:"modifiers"`
}

func main() {
	localIP := getLocalIP()
	port := "3020"
	mobileURL := fmt.Sprintf("http://%s:%s", localIP, port)

	publicFS, err := fs.Sub(content, "public")
	if err != nil {
		fmt.Println("Error accessing embedded public directory:", err)
		return
	}

	http.Handle("/", http.FileServer(http.FS(publicFS)))
	http.HandleFunc("/ws", handleWebSocket)

	http.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"running":   true,
			"mobileUrl": mobileURL,
		})
	})

	http.HandleFunc("/api/qrcode", func(w http.ResponseWriter, r *http.Request) {
		url := r.URL.Query().Get("url")
		if url == "" {
			url = mobileURL
		}
		png, err := qrcode.Encode(url, qrcode.Medium, 256)
		if err != nil {
			http.Error(w, "Failed to generate QR Code", 500)
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.Write(png)
	})

	fmt.Printf("\nApp running! Access URL on mobile: %s\n", mobileURL)

	openBrowser(mobileURL)

	err = http.ListenAndServe("0.0.0.0:"+port, nil)
	if err != nil {
		fmt.Println("Server error:", err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	connMutex.Lock()
	if activeConn != nil {
		connMutex.Unlock()
		http.Error(w, "Only one device allowed at a time", http.StatusLocked)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		connMutex.Unlock()
		return
	}
	activeConn = ws
	connMutex.Unlock()

	defer func() {
		connMutex.Lock()
		activeConn = nil
		connMutex.Unlock()
		ws.Close()
	}()

	for {
		var msg InputMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			break
		}

		switch msg.Type {
		case "MOUSE_MOVE":
			if runtime.GOOS == "linux" {
				// Native Linux command execution via xdotool as fallback
				cmd := exec.Command("xdotool", "mousemove_relative", "--", fmt.Sprintf("%d", int(msg.Dx)), fmt.Sprintf("%d", int(msg.Dy)))
				cmd.Run()
			} else {
				x, y := robotgo.Location()
				robotgo.Move(x+int(msg.Dx), y+int(msg.Dy))
			}

		case "MOUSE_CLICK":
			if runtime.GOOS == "linux" {
				btn := "1"
				if msg.Button == "right" {
					btn = "3"
				}
				exec.Command("xdotool", "click", btn).Run()
			} else {
				robotgo.Click(msg.Button)
			}

		case "KEY_PRESS":
			if len(msg.Modifiers) > 0 {
				var args []interface{}
				for _, m := range msg.Modifiers {
					args = append(args, m)
				}
				robotgo.KeyTap(msg.Key, args...)
			} else {
				robotgo.TypeStr(msg.Key)
			}

		case "KEY_SPECIAL":
			if len(msg.Modifiers) > 0 {
				var args []interface{}
				for _, m := range msg.Modifiers {
					args = append(args, m)
				}
				robotgo.KeyTap(msg.Key, args...)
			} else {
				robotgo.KeyTap(msg.Key)
			}
		}
	}
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "localhost"
}

func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}
	if err != nil {
		fmt.Println("Failed to launch browser:", err)
	}
}
