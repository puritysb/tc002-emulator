// TC002 Advanced Emulator & Studio Core Engine

const WIDTH = 52;
const HEIGHT = 16;
const TOTAL_PIXELS = WIDTH * HEIGHT;
const ROW_SIZE = WIDTH * 3; // 3 bytes per pixel in row-major

const FONT_3x5 = {
    'A': [0x4,0xA,0xA,0xE,0xA], 'B': [0xE,0xA,0xE,0xA,0xE], 'C': [0xE,0x8,0x8,0x8,0xE],
    'D': [0xE,0xA,0xA,0xA,0xE], 'E': [0xE,0x8,0xE,0x8,0xE], 'F': [0xE,0x8,0xE,0x8,0x8],
    'G': [0xE,0x8,0xE,0xA,0xE], 'H': [0xA,0xA,0xE,0xA,0xA], 'I': [0xE,0x4,0x4,0x4,0xE],
    'J': [0xE,0xA,0xA,0xA,0xE], 'K': [0xA,0xA,0xE,0xA,0xA], 'L': [0x8,0x8,0x8,0x8,0xE],
    'M': [0x11,0x1B,0xA,0xA,0xA], 'N': [0xA,0xE,0xA,0xA,0xA], 'O': [0xE,0xA,0xA,0xA,0xE],
    'P': [0xE,0xA,0xE,0x8,0x8], 'Q': [0xE,0xA,0xA,0xA,0xE], 'R': [0xE,0xA,0xE,0xA,0xA],
    'S': [0xE,0x8,0xE,0x2,0xE], 'T': [0xE,0x4,0x4,0x4,0x4], 'U': [0xA,0xA,0xA,0xA,0xE],
    'V': [0xA,0xA,0xA,0xA,0x4], 'W': [0xA,0xA,0xA,0xF,0x11], 'X': [0xA,0xA,0x4,0xA,0xA],
    'Y': [0xA,0xA,0x4,0x4,0x4], 'Z': [0xE,0x2,0x4,0x8,0xE],
    '0': [0xE,0xA,0xE,0x2,0xE], '1': [0x4,0xC,0x4,0x4,0xE], '2': [0xE,0x2,0xE,0x8,0xE],
    '3': [0xE,0x2,0xE,0x2,0xE], '4': [0xA,0xA,0xE,0x2,0x2], '5': [0xE,0x8,0xE,0x2,0xE],
    '6': [0xE,0x8,0xE,0xA,0xE], '7': [0xE,0x2,0x4,0x8,0x8], '8': [0xE,0xA,0xE,0xA,0xE],
    '9': [0xE,0xA,0xE,0x2,0xE], ' ': [0x0,0x0,0x0,0x0,0x0], '!': [0x4,0x4,0x4,0x0,0x4],
    '?': [0xE,0x2,0x4,0x0,0x4], '.': [0x0,0x0,0x0,0x0,0x4], ',': [0x0,0x0,0x0,0x4,0x8],
    '-': [0x0,0x0,0xE,0x0,0x0], '+': [0x0,0x4,0xE,0x4,0x0], '/': [0x2,0x2,0x4,0x8,0x8],
    ':': [0x0,0x4,0x0,0x4,0x0], '@': [0x6,0x9,0xB,0x9,0x6], '#': [0xA,0xE,0xA,0xE,0xA],
    '*': [0x4,0xA,0x4,0xA,0x4], '<': [0x8,0x4,0x2,0x4,0x8], '>': [0x2,0x4,0x8,0x4,0x2],
    '=': [0x0,0xE,0x0,0xE,0x0], '(': [0x4,0x8,0x8,0x8,0x4], ')': [0x8,0x4,0x4,0x4,0x8]
};

class TC002Emulator {
    constructor() {
        this.matrix = new Array(TOTAL_PIXELS).fill(null).map(() => ({ r: 0, g: 0, b: 0 }));
        this.ledElements = [];
        this.animationId = null;
        this.brightness = 1.0;
        this.dialRotation = 0;
        
        // WS and Frame metrics
        this.socket = null;
        this.frameCounter = 0;
        this.lastFrameTime = performance.now();
        this.fpsRolling = 0;
        
        // Hardware state
        this.hwState = {
            mcu: { connected: true },
            wifi: { connected: true },
            ble: { advertising: true },
            mic: { level: 0, enabled: false },
            knob: { state: 'idle' }
        };

        this.initMatrix();
        this.initControls();
        this.initWebSocket();
        this.initKeyboardMappings();
        this.updateHwStatus();
        this.render();
    }

    initMatrix() {
        const matrixEl = document.getElementById('matrix');
        if (!matrixEl) return;

        matrixEl.innerHTML = '';
        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const led = document.createElement('div');
            led.className = 'led';
            matrixEl.appendChild(led);
            this.ledElements.push(led);
        }
    }

    initControls() {
        // Brightness controls
        const brightnessSlider = document.getElementById('brightness');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                this.brightness = e.target.value / 100;
                const label = document.getElementById('brightnessValue');
                if (label) label.textContent = e.target.value + '%';
                this.render();
            });
        }

        // Diffusion overlay control
        const screenEl = document.getElementById('screen');
        const chkDiffusion = document.getElementById('chkDiffusion');
        if (screenEl && chkDiffusion) {
            // Apply initial setting
            if (chkDiffusion.checked) screenEl.classList.add('diffusion');
            chkDiffusion.addEventListener('change', (e) => {
                if (e.target.checked) {
                    screenEl.classList.add('diffusion');
                    this.addLog('info', 'Acrylic diffusion overlay enabled');
                } else {
                    screenEl.classList.remove('diffusion');
                    this.addLog('info', 'Acrylic diffusion overlay disabled (Raw matrix view)');
                }
            });
        }

        // Drop zone image loader
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.loadImage(file);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.loadImage(e.target.files[0]);
                }
            });
        }

        // Interactive Dial assembly
        const knobDial = document.getElementById('knobDial');
        const knobCw = document.getElementById('knobCw');
        const knobCcw = document.getElementById('knobCcw');

        if (knobDial) {
            knobDial.addEventListener('click', () => this.triggerKnobPress());
        }
        if (knobCw) {
            knobCw.addEventListener('click', () => this.rotateKnob(true));
        }
        if (knobCcw) {
            knobCcw.addEventListener('click', () => this.rotateKnob(false));
        }

        // Top button caps mouse bindings
        const setupCapPress = (elId, code) => {
            const cap = document.getElementById(elId);
            if (cap) {
                cap.addEventListener('mousedown', () => {
                    cap.classList.add('active');
                    this.sendKeyEvent(code);
                });
                cap.addEventListener('mouseup', () => cap.classList.remove('active'));
                cap.addEventListener('mouseleave', () => cap.classList.remove('active'));
            }
        };

        setupCapPress('leftBtnCap', 0x04);
        setupCapPress('midBtnCap', 0x05);
        setupCapPress('rightBtnCap', 0x06);
    }

    // Bi-directional WebSockets Setup
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:54200';
        const wsUrl = `${protocol}//${host}/tc002-emulator/ws`;

        this.addLog('info', `Connecting to WebSocket bridge at ${wsUrl}`);
        
        try {
            this.socket = new WebSocket(wsUrl);
            this.socket.binaryType = 'arraybuffer';

            this.socket.onopen = () => {
                this.addLog('info', 'WebSocket bridge connected successfully');
                const valWS = document.getElementById('valWS');
                if (valWS) {
                    valWS.textContent = 'Active';
                    valWS.className = 'telemetry-val active';
                }
            };

            this.socket.onclose = () => {
                this.addLog('err', 'WebSocket bridge connection lost. Retrying in 3s...');
                const valWS = document.getElementById('valWS');
                if (valWS) {
                    valWS.textContent = 'Disconnected';
                    valWS.className = 'telemetry-val inactive';
                }
                setTimeout(() => this.initWebSocket(), 3000);
            };

            this.socket.onerror = (e) => {
                this.addLog('err', 'WebSocket channel error occurred');
                console.error(e);
            };

            this.socket.onmessage = async (event) => {
                try {
                    // Binary byte stream frame decoder (2496 bytes)
                    if (event.data instanceof ArrayBuffer) {
                        const bytes = new Uint8Array(event.data);
                        if (bytes.length === TOTAL_PIXELS * 3) {
                            this.loadBinaryFrame(bytes);
                            this.registerFrameReceived();
                        } else {
                            this.addLog('err', `Binary frame length error: Got ${bytes.length} bytes, expected ${TOTAL_PIXELS * 3}`);
                        }
                    } 
                    // JSON payload frame decoder
                    else if (typeof event.data === 'string') {
                        const payload = JSON.parse(event.data);
                        if (payload.type === 'frame' && Array.isArray(payload.data)) {
                            this.loadArrayFrame(payload.data);
                            this.registerFrameReceived();
                        }
                    }
                } catch (err) {
                    this.addLog('err', `Frame decoding failed: ${err.message}`);
                }
            };

        } catch (e) {
            this.addLog('err', `Socket setup error: ${e.message}`);
        }
    }

    initKeyboardMappings() {
        window.addEventListener('keydown', (e) => {
            // Prevent scrolling on arrows/space
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            switch (e.code) {
                case 'ArrowLeft':
                    this.flashCapActive('leftBtnCap');
                    this.sendKeyEvent(0x04); // Left
                    break;
                case 'ArrowRight':
                    this.flashCapActive('rightBtnCap');
                    this.sendKeyEvent(0x06); // Right
                    break;
                case 'KeyM':
                    this.flashCapActive('midBtnCap');
                    this.sendKeyEvent(0x05); // Mid
                    break;
                case 'ArrowUp':
                    this.rotateKnob(true); // CW
                    break;
                case 'ArrowDown':
                    this.rotateKnob(false); // CCW
                    break;
                case 'Space':
                case 'Enter':
                    this.triggerKnobPress();
                    break;
            }
        });
    }

    // Flash button cap helper
    flashCapActive(elId) {
        const cap = document.getElementById(elId);
        if (cap) {
            cap.classList.add('active');
            setTimeout(() => cap.classList.remove('active'), 150);
        }
    }

    // UI Telemetry Log helper
    addLog(type, msg) {
        const logsEl = document.getElementById('terminalLogs');
        if (!logsEl) return;

        const timeStr = new Date().toTimeString().split(' ')[0];
        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        logItem.innerHTML = `<span class="time">[${timeStr}]</span><span class="msg">${msg}</span>`;
        
        logsEl.appendChild(logItem);
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    // Binary Decoder Matrix Mapper
    loadBinaryFrame(bytes) {
        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const offset = i * 3;
            this.matrix[i] = {
                r: bytes[offset],
                g: bytes[offset + 1],
                b: bytes[offset + 2]
            };
        }
        this.render();
    }

    // JSON array frame mapper
    loadArrayFrame(data) {
        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const offset = i * 3;
            if (offset + 2 < data.length) {
                this.matrix[i] = {
                    r: data[offset],
                    g: data[offset + 1],
                    b: data[offset + 2]
                };
            }
        }
        this.render();
    }

    registerFrameReceived() {
        this.frameCounter++;
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        
        // Calculate rolling average FPS
        if (delta > 0) {
            const currentFps = 1000 / delta;
            this.fpsRolling = Math.round(this.fpsRolling * 0.9 + currentFps * 0.1);
        }
        
        this.lastFrameTime = now;

        // Update UI Telemetry
        const valFrames = document.getElementById('valFrames');
        const bezelFPS = document.getElementById('bezelFPS');
        if (valFrames) valFrames.textContent = this.frameCounter;
        if (bezelFPS) bezelFPS.textContent = `${this.fpsRolling} FPS`;

        if (this.frameCounter % 100 === 0) {
            this.addLog('ws-in', `Received ${this.frameCounter} frames total (Current: ${this.fpsRolling} FPS)`);
        }
    }

    // Key event dispatcher via WS channel
    sendKeyEvent(code) {
        const hexCode = '0x' + code.toString(16).padStart(2, '0').toUpperCase();
        let keyName = 'Unknown';
        switch (code) {
            case 0x01: keyName = 'Dial Rotate CW'; break;
            case 0x02: keyName = 'Dial Rotate CCW'; break;
            case 0x03: keyName = 'Dial Pressed'; break;
            case 0x04: keyName = 'Left Button Press'; break;
            case 0x05: keyName = 'Middle Button Press'; break;
            case 0x06: keyName = 'Right Button Press'; break;
        }

        this.addLog('ws-out', `Key Event Emitted: ${keyName} (${hexCode})`);

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'key',
                code: code,
                timestamp: Date.now()
            }));
        }
    }

    // Interactive dial operations
    rotateKnob(clockwise) {
        // Rotate visual dial element
        const dial = document.getElementById('dialFace');
        this.dialRotation += clockwise ? 20 : -20;
        if (dial) {
            dial.style.transform = `rotate(${this.dialRotation}deg)`;
        }

        // Flash CCW/CW button highlights
        const btn = document.getElementById(clockwise ? 'knobCw' : 'knobCcw');
        if (btn) {
            btn.style.backgroundColor = '#3b82f6';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 100);
        }

        this.sendKeyEvent(clockwise ? 0x01 : 0x02);
    }

    triggerKnobPress() {
        const knobDial = document.getElementById('knobDial');
        if (knobDial) {
            knobDial.style.transform = 'translateY(-50%) scale(0.9)';
            setTimeout(() => knobDial.style.transform = 'translateY(-50%)', 100);
        }
        this.sendKeyEvent(0x03);
    }

    // Hardware overrides simulation
    simulateMic() {
        this.hwState.mic.enabled = !this.hwState.mic.enabled;
        if (this.hwState.mic.enabled) {
            this.addLog('info', 'Microphone level telemetry feed started');
            let count = 0;
            const runFeed = () => {
                if (!this.hwState.mic.enabled) {
                    this.addLog('info', 'Microphone telemetry feed stopped');
                    return;
                }
                count += 0.15;
                const percent = Math.floor(Math.abs(Math.sin(count)) * 100);
                this.addLog('ws-out', `Mic analog level telemetry: ${percent}%`);
                
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'telemetry',
                        sensor: 'mic',
                        value: percent,
                        timestamp: Date.now()
                    }));
                }
                setTimeout(runFeed, 1000);
            };
            runFeed();
        }
    }

    toggleWifi() {
        this.hwState.wifi.connected = !this.hwState.wifi.connected;
        const led = document.getElementById('ledWiFi');
        if (led) {
            if (this.hwState.wifi.connected) {
                led.className = 'led-dot green-on';
                this.addLog('info', 'WiFi interface connected. Host active.');
            } else {
                led.className = 'led-dot';
                this.addLog('err', 'WiFi link dropped. Station unreachable.');
            }
        }
    }

    toggleBle() {
        this.hwState.ble.advertising = !this.hwState.ble.advertising;
        const led = document.getElementById('ledBLE');
        if (led) {
            if (this.hwState.ble.advertising) {
                led.className = 'led-dot amber-on';
                this.addLog('info', 'BLE Advertisements active (UUID: TC002_EMULATOR)');
            } else {
                led.className = 'led-dot';
                this.addLog('info', 'BLE Transceiver deactivated.');
            }
        }
    }

    updateHwStatus() {
        // Base initialization logging
        this.addLog('info', 'Internal systems operational');
        this.addLog('info', 'MCU system online. Flash memory OK');
        this.addLog('info', 'WiFi stack ready (clock.local)');
        this.addLog('info', 'BLE Advertising enabled');
    }

    // Graphical canvas image processors
    loadImage(file) {
        const img = new Image();
        img.onload = () => this.drawImageToMatrix(img);
        img.src = URL.createObjectURL(file);
        
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.add('active');
            dropZone.textContent = `Loaded: ${file.name.substring(0, 15)}...`;
        }
        
        this.addLog('info', `Image loaded successfully: ${file.name}`);
    }

    drawImageToMatrix(img) {
        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
        const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const offset = i * 4;
            this.matrix[i] = {
                r: imageData.data[offset],
                g: imageData.data[offset + 1],
                b: imageData.data[offset + 2]
            };
        }
        this.render();
    }

    displayText(effect = 'static') {
        const textInput = document.getElementById('textInput');
        const colorSelect = document.getElementById('textColor');
        const text = textInput ? textInput.value || 'HELLO' : 'HELLO';
        const color = colorSelect ? colorSelect.value : '#ffffff';

        const rgb = this.hexToRgb(color);
        this.matrix.fill({ r: 0, g: 0, b: 0 });

        const chars = text.toUpperCase().split('');
        let offsetX = 0;

        chars.forEach(char => {
            const fontData = FONT_3x5[char] || FONT_3x5['?'];
            const charWidth = 4;

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 3; col++) {
                    if (fontData[row] & (1 << (2 - col))) {
                        const x = offsetX + col;
                        const y = Math.floor(HEIGHT / 2) - 2 + row;
                        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                            const index = y * WIDTH + x;
                            this.matrix[index] = { ...rgb };
                        }
                    }
                }
            }
            offsetX += charWidth;
        });

        if (effect === 'scroll') {
            this.scrollText(text, color);
        } else {
            if (this.animationId) cancelAnimationFrame(this.animationId);
            this.render();
            this.addLog('info', `Static text drawn: "${text}"`);
        }
    }

    scrollText(text, color) {
        const rgb = this.hexToRgb(color);
        const chars = text.toUpperCase().split('');
        const charWidth = 4;
        let scrollOffset = WIDTH;

        const scroll = () => {
            this.matrix.fill({ r: 0, g: 0, b: 0 });

            chars.forEach((char, charIndex) => {
                const fontData = FONT_3x5[char] || FONT_3x5['?'];

                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 3; col++) {
                        if (fontData[row] & (1 << (2 - col))) {
                            const x = scrollOffset + charIndex * charWidth + col;
                            const y = Math.floor(HEIGHT / 2) - 2 + row;

                            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                                const index = y * WIDTH + x;
                                this.matrix[index] = { ...rgb };
                            }
                        }
                    }
                }
            });

            scrollOffset--;
            this.render();

            if (scrollOffset + chars.length * charWidth > 0) {
                this.animationId = requestAnimationFrame(scroll);
            } else {
                this.addLog('info', 'Text scrolling finished');
            }
        };

        if (this.animationId) cancelAnimationFrame(this.animationId);
        scroll();
        this.addLog('info', `Scrolling text started: "${text}"`);
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.matrix.fill({ r: 0, g: 0, b: 0 });
        this.render();
        this.addLog('info', 'Display resets. Buffers cleared');
    }

    setPixel(x, y, r, g, b) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
        this.matrix[y * WIDTH + x] = { r, g, b };
    }

    render() {
        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const led = this.ledElements[i];
            if (!led) continue;

            const color = this.matrix[i];
            const r = Math.min(255, Math.floor(color.r * this.brightness));
            const g = Math.min(255, Math.floor(color.g * this.brightness));
            const b = Math.min(255, Math.floor(color.b * this.brightness));
            const sum = r + g + b;

            led.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

            // Generate circular glow drop shadow if the LED is illuminated
            if (sum > 45) {
                led.style.boxShadow = `0 0 6px rgba(${r}, ${g}, ${b}, 0.7)`;
            } else {
                led.style.boxShadow = 'none';
            }
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
}

// Instantiate emulator on startup and expose globally
window.emulator = new TC002Emulator();
