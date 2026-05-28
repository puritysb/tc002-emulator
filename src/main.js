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
        try {
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

            // Firmware OSD overlay states
            this.volume = 50;
            this.isOsdActive = false;
            this.savedMatrix = null;
            this.osdTimeout = null;

            this.initMatrix();
            this.initControls();
            this.initWebSocket();
            this.initKeyboardMappings();
            this.updateHwStatus();
            this.render();
        } catch (err) {
            console.error('Error during TC002Emulator initialization:', err);
        }
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
        const setupCapPress = (elId, code, arrowLeft) => {
            const cap = document.getElementById(elId);
            if (cap) {
                cap.addEventListener('mousedown', () => {
                    cap.classList.add('active');
                    this.sendKeyEvent(code);
                    if (arrowLeft !== undefined) {
                        this.showOSD(() => this.drawArrowOSD(arrowLeft));
                    } else if (code === 0x05) {
                        this.showOSD(() => this.drawMenuOSD());
                    }
                });
                cap.addEventListener('mouseup', () => cap.classList.remove('active'));
                cap.addEventListener('mouseleave', () => cap.classList.remove('active'));
            }
        };

        setupCapPress('leftBtnCap', 0x04, true);
        setupCapPress('midBtnCap', 0x05);
        setupCapPress('rightBtnCap', 0x06, false);
    }

    // Bi-directional WebSockets Setup
    initWebSocket() {
        const host = window.location.hostname;
        const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host) || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.');

        if (!isLocal) {
            const valWS = document.getElementById('valWS');
            if (valWS) {
                valWS.textContent = 'Demo Mode';
                valWS.className = 'telemetry-val';
                valWS.style.color = '#3b82f6'; // Stylized Blue
            }
            this.addLog('info', 'Standalone Demo Mode active (WebSocket bridge inactive on public cloud)');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/tc002-emulator/ws`;

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
                this.addLog('err', 'WebSocket bridge connection lost. Retrying in 5s...');
                const valWS = document.getElementById('valWS');
                if (valWS) {
                    valWS.textContent = 'Disconnected';
                    valWS.className = 'telemetry-val inactive';
                }
                setTimeout(() => this.initWebSocket(), 5000);
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
                    this.showOSD(() => this.drawArrowOSD(true));
                    break;
                case 'ArrowRight':
                    this.flashCapActive('rightBtnCap');
                    this.sendKeyEvent(0x06); // Right
                    this.showOSD(() => this.drawArrowOSD(false));
                    break;
                case 'KeyM':
                    this.flashCapActive('midBtnCap');
                    this.sendKeyEvent(0x05); // Mid
                    this.showOSD(() => this.drawMenuOSD());
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

        // Adjust volume state
        if (clockwise) {
            this.volume = Math.min(100, this.volume + 5);
        } else {
            this.volume = Math.max(0, this.volume - 5);
        }
        this.showOSD(() => this.drawVolumeOSD());

        this.sendKeyEvent(clockwise ? 0x01 : 0x02);
    }

    triggerKnobPress() {
        const knobDial = document.getElementById('knobDial');
        if (knobDial) {
            knobDial.style.transform = 'translateY(-50%) scale(0.9)';
            setTimeout(() => knobDial.style.transform = 'translateY(-50%)', 100);
        }
        this.showOSD(() => this.drawVolumeOSD()); // Show current volume level on press
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
        this.showOSD(() => this.drawWiFiOSD(this.hwState.wifi.connected));
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
        this.showOSD(() => this.drawBleOSD(this.hwState.ble.advertising));
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
        const charWidth = 4;
        const totalWidth = chars.length * charWidth - 1; // Subtract 1 for no trailing space after last char
        let offsetX = Math.max(0, Math.floor((WIDTH - totalWidth) / 2));

        chars.forEach(char => {
            const fontData = FONT_3x5[char] || FONT_3x5['?'];

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 3; col++) {
                    if (fontData[row] & (1 << (3 - col))) {
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
                        if (fontData[row] & (1 << (3 - col))) {
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

            // DOM write caching to prevent shearing and lag
            const newBg = `rgb(${r}, ${g}, ${b})`;
            if (led.dataset.color !== newBg) {
                led.style.backgroundColor = newBg;
                led.dataset.color = newBg;
                
                if (sum > 45) {
                    led.style.boxShadow = `0 0 6px rgba(${r}, ${g}, ${b}, 0.7)`;
                } else {
                    led.style.boxShadow = 'none';
                }
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

    // OSD & Screen Overlay System
    showOSD(drawFunc) {
        if (this.osdTimeout) {
            clearTimeout(this.osdTimeout);
            this.osdTimeout = null;
        }

        // Save current matrix state if not currently saved
        if (!this.savedMatrix) {
            this.savedMatrix = this.matrix.map(pixel => ({ ...pixel }));
        }

        this.isOsdActive = true;

        // Clear matrix and draw OSD
        this.matrix.fill({ r: 0, g: 0, b: 0 });
        drawFunc();
        this.render();

        // Restore saved screen after 1.5 seconds
        this.osdTimeout = setTimeout(() => {
            if (this.savedMatrix) {
                this.matrix = this.savedMatrix.map(pixel => ({ ...pixel }));
                this.savedMatrix = null;
            }
            this.isOsdActive = false;
            this.render();
        }, 1500);
    }

    // OSD Drawings
    drawVolumeOSD() {
        const rgb = { r: 59, g: 130, b: 246 }; // Blue
        // Draw Speaker Icon (simple pixel art)
        const speakerPixels = [
            [7, 5], [7, 6], [7, 7], [7, 8], [7, 9], [7, 10],
            [8, 6], [8, 7], [8, 8], [8, 9],
            [9, 7], [9, 8]
        ];
        speakerPixels.forEach(([x, y]) => this.setPixel(x, y, 255, 255, 255));

        // Draw Volume progress bar container
        const barStartX = 15;
        const barEndX = 45;
        const barWidth = barEndX - barStartX;
        const fillWidth = Math.round((this.volume / 100) * barWidth);

        for (let x = barStartX; x <= barEndX; x++) {
            this.setPixel(x, 4, 30, 30, 45);
            this.setPixel(x, 11, 30, 30, 45);
        }
        for (let y = 4; y <= 11; y++) {
            this.setPixel(barStartX, y, 30, 30, 45);
            this.setPixel(barEndX, y, 30, 30, 45);
        }

        // Draw progress fill
        for (let x = barStartX + 1; x < barStartX + fillWidth; x++) {
            for (let y = 6; y <= 9; y++) {
                this.setPixel(x, y, rgb.r, rgb.g, rgb.b);
            }
        }
    }

    drawArrowOSD(left) {
        const rgb = { r: 245, g: 158, b: 11 }; // Amber
        const cx = Math.floor(WIDTH / 2);
        const cy = Math.floor(HEIGHT / 2);
        
        if (left) {
            for (let x = cx - 5; x <= cx + 5; x++) {
                this.setPixel(x, cy, rgb.r, rgb.g, rgb.b);
            }
            this.setPixel(cx - 4, cy - 1, rgb.r, rgb.g, rgb.b);
            this.setPixel(cx - 3, cy - 2, rgb.r, rgb.g, rgb.b);
            this.setPixel(cx - 4, cy + 1, rgb.r, rgb.g, rgb.b);
            this.setPixel(cx - 3, cy + 2, rgb.r, rgb.g, rgb.b);
        } else {
            for (let x = cx - 5; x <= cx + 5; x++) {
                this.setPixel(x, cy, rgb.r, rgb.g, rgb.b);
            }
            this.setPixel(cx + 4, cy - 1, rgb.r, rgb.g, rgb.b);
            this.setPixel(cx + 3, cy - 2, rgb.r, rgb.g, rgb.b);
            this.setPixel(cx + 4, cy + 1, rgb.r, rgb.g, rgb.b);
            this.setPixel(cx + 3, cy + 2, rgb.r, rgb.g, rgb.b);
        }
    }

    drawMenuOSD() {
        const rgb = { r: 168, g: 85, b: 247 }; // Purple
        const cx = Math.floor(WIDTH / 2);
        const cy = Math.floor(HEIGHT / 2);
        
        for (let x = cx - 6; x <= cx + 6; x++) {
            this.setPixel(x, cy - 3, rgb.r, rgb.g, rgb.b);
            this.setPixel(x, cy, rgb.r, rgb.g, rgb.b);
            this.setPixel(x, cy + 3, rgb.r, rgb.g, rgb.b);
        }
    }

    drawWiFiOSD(connected) {
        const rgb = connected ? { r: 16, g: 185, b: 129 } : { r: 239, g: 68, b: 68 };
        const cx = Math.floor(WIDTH / 2);
        const cy = Math.floor(HEIGHT / 2);
        
        this.setPixel(cx, cy + 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 2, cy + 1, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 1, cy, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx, cy, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 1, cy, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 2, cy + 1, rgb.r, rgb.g, rgb.b);
        
        this.setPixel(cx - 4, cy - 2, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 3, cy - 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 2, cy - 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 1, cy - 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx, cy - 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 1, cy - 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 2, cy - 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 3, cy - 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 4, cy - 2, rgb.r, rgb.g, rgb.b);
    }

    drawBleOSD(active) {
        const rgb = active ? { r: 59, g: 130, b: 246 } : { r: 107, g: 114, b: 128 };
        const cx = Math.floor(WIDTH / 2);
        const cy = Math.floor(HEIGHT / 2);
        
        for (let y = cy - 5; y <= cy + 5; y++) {
            this.setPixel(cx, y, rgb.r, rgb.g, rgb.b);
        }
        this.setPixel(cx + 1, cy - 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 2, cy - 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 1, cy - 2, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 1, cy + 4, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 2, cy + 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx + 1, cy + 2, rgb.r, rgb.g, rgb.b);
        
        this.setPixel(cx - 1, cy - 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 2, cy - 2, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 1, cy + 3, rgb.r, rgb.g, rgb.b);
        this.setPixel(cx - 2, cy + 2, rgb.r, rgb.g, rgb.b);
    }

    // Effect Presets
    startClockAnimation() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        const tick = () => {
            if (this.isOsdActive) {
                this.animationId = requestAnimationFrame(tick);
                return;
            }
            
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            
            const now = new Date();
            const hrs = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            const secs = now.getSeconds().toString().padStart(2, '0');
            
            const clockText = `${hrs}:${mins}:${secs}`;
            const rgb = { r: 16, g: 185, b: 129 }; // Emerald Green
            
            const chars = clockText.split('');
            const charWidth = 4;
            const totalWidth = chars.length * charWidth - 1;
            let offsetX = Math.max(0, Math.floor((WIDTH - totalWidth) / 2));
            
            chars.forEach((char) => {
                const fontData = FONT_3x5[char] || FONT_3x5['?'];
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 3; col++) {
                        if (fontData[row] & (1 << (3 - col))) {
                            const x = offsetX + col;
                            const y = Math.floor(HEIGHT / 2) - 2 + row;
                            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                                this.matrix[y * WIDTH + x] = { ...rgb };
                            }
                        }
                    }
                }
                offsetX += charWidth;
            });
            
            this.render();
            this.animationId = requestAnimationFrame(tick);
        };
        
        tick();
        this.addLog('info', 'Digital Clock effect started');
    }

    startEqualizerAnimation() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        let offset = 0;
        const tick = () => {
            if (this.isOsdActive) {
                this.animationId = requestAnimationFrame(tick);
                return;
            }
            
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            offset += 0.1;
            
            for (let c = 0; c < 26; c++) {
                const x1 = c * 2;
                const x2 = c * 2 + 1;
                const val = Math.sin(c * 0.4 + offset) * 0.4 + Math.cos(c * 0.2 - offset) * 0.4 + 0.8;
                const height = Math.max(1, Math.min(HEIGHT, Math.floor(val * (HEIGHT / 1.6))));
                
                for (let y = HEIGHT - 1; y >= HEIGHT - height; y--) {
                    let r = 0, g = 200, b = 0;
                    const hFactor = (HEIGHT - 1 - y) / HEIGHT;
                    if (hFactor > 0.7) {
                        r = 239; g = 68; b = 68;
                    } else if (hFactor > 0.4) {
                        r = 245; g = 158; b = 11;
                    }
                    this.matrix[y * WIDTH + x1] = { r, g, b };
                    this.matrix[y * WIDTH + x2] = { r, g, b };
                }
            }
            
            this.render();
            this.animationId = requestAnimationFrame(tick);
        };
        
        tick();
        this.addLog('info', 'Spectrum Equalizer effect started');
    }

    startPlasmaAnimation() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        let time = 0;
        const tick = () => {
            if (this.isOsdActive) {
                this.animationId = requestAnimationFrame(tick);
                return;
            }
            
            time += 0.04;
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const v1 = Math.sin(x * 0.15 + time);
                    const v2 = Math.sin(0.15 * (x * Math.sin(time / 2) + y * Math.cos(time / 3)) + time);
                    const cx = x - WIDTH / 2 + 5 * Math.sin(time / 5);
                    const cy = y - HEIGHT / 2 + 5 * Math.cos(time / 3);
                    const v3 = Math.sin(Math.sqrt(cx * cx + cy * cy) * 0.2 + time);
                    const total = (v1 + v2 + v3) / 3;
                    
                    const hue = (total + 1) / 2;
                    const rgb = this.hslToRgb(hue, 1, 0.5);
                    this.matrix[y * WIDTH + x] = { r: rgb[0], g: rgb[1], b: rgb[2] };
                }
            }
            
            this.render();
            this.animationId = requestAnimationFrame(tick);
        };
        
        tick();
        this.addLog('info', 'Plasma Wave effect started');
    }

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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

// Initialize and expose to window when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.emulator = new TC002Emulator();
    });
} else {
    window.emulator = new TC002Emulator();
}
