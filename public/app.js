document.addEventListener("DOMContentLoaded", () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Only trigger web fallback when on public hosting (wscodework.me or github.io)
  const isHostedWeb =
    window.location.hostname === "wscodework.me" ||
    window.location.hostname.endsWith("github.io");

  const desktopUI = document.getElementById("desktopUI");
  const mobileUI = document.getElementById("mobileUI");
  const qrSection = document.getElementById("qrSection");
  const fallbackNotice = document.getElementById("fallbackNotice");

  // Handle Mobile vs Desktop UI layout
  if (isMobile) {
    if (desktopUI) desktopUI.style.display = "none";
    if (mobileUI) mobileUI.style.display = "flex";
    initMobileRemote();
  } else {
    // Handle Public Web deployment vs Local App Server
    if (isHostedWeb) {
      if (qrSection) qrSection.style.display = "none";
      if (fallbackNotice) fallbackNotice.style.display = "block";
    } else {
      if (fallbackNotice) fallbackNotice.style.display = "none";
      fetchQR();
    }
  }
});

// Fetch QR Code from Local App Server
function fetchQR() {
  const qrImg = document.getElementById("qrImage");
  const urlText = document.getElementById("mobileUrlText");

  if (!qrImg || !urlText) return;

  const localUrl = window.location.origin;
  urlText.innerText = localUrl;
  // Point to /api/qrcode matching your Go backend
  qrImg.src = `/api/qrcode?url=${encodeURIComponent(localUrl)}`;

  qrImg.onerror = () => {
    const qrSection = document.getElementById("qrSection");
    const fallbackNotice = document.getElementById("fallbackNotice");
    if (qrSection) qrSection.style.display = "none";
    if (fallbackNotice) fallbackNotice.style.display = "block";
  };
}

// 1-Click Copy with Cross-Browser HTTP/HTTPS Fallback
function copyCmd(elementId, btnElement) {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) return;
  const text = targetEl.innerText;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => showSuccess(btnElement))
      .catch(() => fallbackCopy(text, btnElement));
  } else {
    fallbackCopy(text, btnElement);
  }
}

function fallbackCopy(text, btnElement) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand("copy");
    showSuccess(btnElement);
  } catch (err) {
    console.error("Copy failed", err);
  } finally {
    document.body.removeChild(textArea);
  }
}

function showSuccess(btnElement) {
  if (!btnElement) return;
  btnElement.innerText = "Copied!";
  btnElement.classList.add("copied");
  setTimeout(() => {
    btnElement.innerText = "Copy";
    btnElement.classList.remove("copied");
  }, 2000);
}

// Mobile WebSocket Remote Logic
function initMobileRemote() {
  const statusEl = document.getElementById("status");
  const statusDot = document.getElementById("statusDot");
  let ws = null;
  let reconnectInterval = null;

  // Retrieve or generate persistent session token
  let sessionToken = localStorage.getItem("cyber_remote_session");
  if (!sessionToken) {
    sessionToken =
      "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("cyber_remote_session", sessionToken);
  }

  // Auto-connect Function
  function connectWebSocket() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}/ws?session=${sessionToken}`);

    ws.onopen = () => {
      if (statusEl) {
        statusEl.innerText = "CONNECTED";
        statusEl.style.color = "#10b981";
      }
      if (statusDot) statusDot.classList.add("online");

      // Send auth handshake with session token
      ws.send(JSON.stringify({ type: "AUTH_SESSION", token: sessionToken }));

      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onclose = () => {
      if (statusEl) {
        statusEl.innerText = "RECONNECTING...";
        statusEl.style.color = "#ef4444";
      }
      if (statusDot) statusDot.classList.remove("online");

      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          connectWebSocket();
        }, 2000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  // Establish connection on initial page load
  connectWebSocket();

  const activeModifiers = { ctrl: false, alt: false, shift: false };

  function getModifiersList() {
    const list = [];
    if (activeModifiers.ctrl) list.push("ctrl");
    if (activeModifiers.alt) list.push("alt");
    if (activeModifiers.shift) list.push("shift");
    return list;
  }

  function clearModifiers() {
    activeModifiers.ctrl = false;
    activeModifiers.alt = false;
    activeModifiers.shift = false;
    document
      .querySelectorAll(".key.modifier")
      .forEach((b) => b.classList.remove("active"));
  }

  function sendKey(key, action = "KEY_SPECIAL") {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: action,
          key: key,
          modifiers: getModifiersList(),
        })
      );
      clearModifiers();
    }
  }

  // --- Trackpad Touch Controls ---
  const trackpad = document.getElementById("trackpad");
  let lastX = 0,
    lastY = 0;
  let isPointerDown = false;
  let touchStartTime = 0;
  let isMoving = false;

  if (trackpad) {
    trackpad.addEventListener("pointerdown", (e) => {
      trackpad.setPointerCapture(e.pointerId);
      isPointerDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      touchStartTime = Date.now();
      isMoving = false;
    });

    trackpad.addEventListener("pointermove", (e) => {
      if (!isPointerDown) return;

      const dx = Math.round((e.clientX - lastX) * 2.5);
      const dy = Math.round((e.clientY - lastY) * 2.5);
      lastX = e.clientX;
      lastY = e.clientY;

      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        isMoving = true;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "MOUSE_MOVE", dx: dx, dy: dy }));
        }
      }
    });

    trackpad.addEventListener("pointerup", () => {
      isPointerDown = false;
      const duration = Date.now() - touchStartTime;
      if (!isMoving && ws && ws.readyState === WebSocket.OPEN) {
        if (duration > 450) {
          ws.send(JSON.stringify({ type: "MOUSE_CLICK", button: "right" }));
        } else {
          ws.send(JSON.stringify({ type: "MOUSE_CLICK", button: "left" }));
        }
      }
    });
  }

  // --- Native Keyboard Input ---
  const input = document.getElementById("keyboardInput");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") sendKey("backspace", "KEY_SPECIAL");
      else if (e.key === "Enter") sendKey("enter", "KEY_SPECIAL");
    });

    input.addEventListener("input", (e) => {
      if (e.data) sendKey(e.data, "KEY_PRESS");
      input.value = "";
    });
  }

  // --- Modifier Buttons ---
  document.querySelectorAll(".key.modifier").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mod = btn.getAttribute("data-mod");
      activeModifiers[mod] = !activeModifiers[mod];
      btn.classList.toggle("active", activeModifiers[mod]);
    });
  });

  // --- Standard Keys ---
  document
    .querySelectorAll(".key:not(.modifier):not(.holdable)")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        sendKey(btn.getAttribute("data-key"), "KEY_SPECIAL");
      });
    });

  // --- Holdable Backspace Button ---
  const backspaceBtn = document.getElementById("backspaceBtn");
  let holdInterval = null;

  function startHold() {
    sendKey("backspace", "KEY_SPECIAL");
    holdInterval = setInterval(() => sendKey("backspace", "KEY_SPECIAL"), 90);
  }

  function stopHold() {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
  }

  if (backspaceBtn) {
    backspaceBtn.addEventListener("pointerdown", startHold);
    backspaceBtn.addEventListener("pointerup", stopHold);
    backspaceBtn.addEventListener("pointercancel", stopHold);
  }
}