const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Hide QR container if accessed over web deployment rather than local app server
if (window.location.hostname === "wscodework.me" || window.location.hostname.endsWith("github.io")) {
  const qrSection = document.getElementById("qrSection");
  if (qrSection) qrSection.style.display = "none";
} 

if (isMobile) {
  document.getElementById('desktopUI').style.display = 'none';
  document.getElementById('mobileUI').style.display = 'flex';
  initMobileRemote();
} else {
  fetch('/api/status')
    .then(res => res.json())
    .then(data => {
      if (data.running) {
        document.getElementById('qrImage').src = `/api/qrcode?url=${encodeURIComponent(data.mobileUrl)}`;
        document.getElementById('mobileUrlText').innerText = data.mobileUrl;
      }
    })
    .catch(() => {});
}

function copyCmd(elementId, btnElement) {
  const text = document.getElementById(elementId).innerText;

  // Use Clipboard API if available (HTTPS / Localhost)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showSuccess(btnElement));
  } else {
    // Fallback for HTTP / IP addresses
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showSuccess(btnElement);
    } catch (err) {
      console.error('Copy failed', err);
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

function showSuccess(btnElement) {
  btnElement.innerText = "Copied!";
  btnElement.classList.add("copied");
  setTimeout(() => {
    btnElement.innerText = "Copy";
    btnElement.classList.remove("copied");
  }, 2000);
}

function initMobileRemote() {
  const statusEl = document.getElementById('status');
  const statusDot = document.getElementById('statusDot');
  let ws = null;
  let reconnectInterval = null;

  // Retrieve or generate persistent session token
  let sessionToken = localStorage.getItem('cyber_remote_session');
  if (!sessionToken) {
    sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('cyber_remote_session', sessionToken);
  }

  // Auto-connect Function
  function connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${location.host}/ws?session=${sessionToken}`);

    ws.onopen = () => {
      statusEl.innerText = "CONNECTED";
      statusEl.style.color = "#00ff88";
      if (statusDot) statusDot.classList.add('online');
      
      // Send auth handshake with session token
      ws.send(JSON.stringify({ type: 'AUTH_SESSION', token: sessionToken }));

      // Clear reconnect loop if connected
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onclose = () => {
      statusEl.innerText = "RECONNECTING...";
      statusEl.style.color = "#ff3b30";
      if (statusDot) statusDot.classList.remove('online');

      // Attempt automatic reconnect every 2 seconds if connection drops
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
    if (activeModifiers.ctrl) list.push('ctrl');
    if (activeModifiers.alt) list.push('alt');
    if (activeModifiers.shift) list.push('shift');
    return list;
  }

  function clearModifiers() {
    activeModifiers.ctrl = false;
    activeModifiers.alt = false;
    activeModifiers.shift = false;
    document.querySelectorAll('.key.modifier').forEach(b => b.classList.remove('active'));
  }

  function sendKey(key, action = 'KEY_SPECIAL') {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: action, 
        key: key,
        modifiers: getModifiersList()
      }));
      clearModifiers();
    }
  }

  // --- Trackpad Logic ---
  const trackpad = document.getElementById('trackpad');
  let lastX = 0, lastY = 0;
  let isPointerDown = false;
  let touchStartTime = 0;
  let isMoving = false;

  trackpad.addEventListener('pointerdown', (e) => {
    trackpad.setPointerCapture(e.pointerId);
    isPointerDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
    touchStartTime = Date.now();
    isMoving = false;
  });

  trackpad.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;

    const dx = Math.round((e.clientX - lastX) * 2.5);
    const dy = Math.round((e.clientY - lastY) * 2.5);
    lastX = e.clientX;
    lastY = e.clientY;

    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      isMoving = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'MOUSE_MOVE', dx: dx, dy: dy }));
      }
    }
  });

  trackpad.addEventListener('pointerup', () => {
    isPointerDown = false;
    const duration = Date.now() - touchStartTime;
    if (!isMoving && ws && ws.readyState === WebSocket.OPEN) {
      if (duration > 450) {
        ws.send(JSON.stringify({ type: 'MOUSE_CLICK', button: 'right' }));
      } else {
        ws.send(JSON.stringify({ type: 'MOUSE_CLICK', button: 'left' }));
      }
    }
  });

  // --- Keyboard Input ---
  const input = document.getElementById('keyboardInput');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') sendKey('backspace', 'KEY_SPECIAL');
    else if (e.key === 'Enter') sendKey('enter', 'KEY_SPECIAL');
  });

  input.addEventListener('input', (e) => {
    if (e.data) sendKey(e.data, 'KEY_PRESS');
    input.value = '';
  });

  // --- Modifier Buttons ---
  document.querySelectorAll('.key.modifier').forEach(btn => {
    btn.addEventListener('click', () => {
      const mod = btn.getAttribute('data-mod');
      activeModifiers[mod] = !activeModifiers[mod];
      btn.classList.toggle('active', activeModifiers[mod]);
    });
  });

  // --- Standard Keys ---
  document.querySelectorAll('.key:not(.modifier):not(.holdable)').forEach(btn => {
    btn.addEventListener('click', () => {
      sendKey(btn.getAttribute('data-key'), 'KEY_SPECIAL');
    });
  });

  // --- Holdable Backspace ---
  const backspaceBtn = document.getElementById('backspaceBtn');
  let holdInterval = null;

  function startHold() {
    sendKey('backspace', 'KEY_SPECIAL');
    holdInterval = setInterval(() => sendKey('backspace', 'KEY_SPECIAL'), 90);
  }

  function stopHold() {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
  }

  backspaceBtn.addEventListener('pointerdown', startHold);
  backspaceBtn.addEventListener('pointerup', stopHold);
  backspaceBtn.addEventListener('pointercancel', stopHold);
}
