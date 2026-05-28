// TC002 Advanced Emulator & Studio Core Engine

const WIDTH = 52;
const HEIGHT = 16;
const TOTAL_PIXELS = WIDTH * HEIGHT;
const ROW_SIZE = WIDTH * 3; // 3 bytes per pixel in row-major

const FONT_2x3 = {
    'A': [0x2,0x3,0x3], 'B': [0x3,0x3,0x3], 'C': [0x3,0x2,0x3], 'D': [0x3,0x3,0x3],
    'E': [0x3,0x2,0x3], 'F': [0x3,0x2,0x2], 'G': [0x3,0x3,0x3], 'H': [0x3,0x3,0x3],
    'I': [0x2,0x2,0x2], 'J': [0x1,0x3,0x3], 'K': [0x3,0x2,0x3], 'L': [0x2,0x2,0x3],
    'M': [0x3,0x3,0x3], 'N': [0x3,0x3,0x3], 'O': [0x3,0x3,0x3], 'P': [0x3,0x3,0x2],
    'Q': [0x3,0x3,0x3], 'R': [0x3,0x3,0x3], 'S': [0x3,0x1,0x3], 'T': [0x3,0x2,0x2],
    'U': [0x3,0x3,0x3], 'V': [0x3,0x3,0x2], 'W': [0x3,0x3,0x3], 'X': [0x3,0x2,0x3],
    'Y': [0x3,0x3,0x2], 'Z': [0x3,0x2,0x3],
    '0': [0x3,0x3,0x3], '1': [0x2,0x2,0x2], '2': [0x3,0x2,0x3], '3': [0x3,0x1,0x3],
    '4': [0x3,0x3,0x1], '5': [0x3,0x2,0x3], '6': [0x3,0x3,0x3], '7': [0x3,0x1,0x1],
    '8': [0x3,0x3,0x3], '9': [0x3,0x3,0x3], ' ': [0x0,0x0,0x0], '?': [0x3,0x1,0x2],
    '!': [0x2,0x2,0x0], '.': [0x0,0x0,0x2]
};

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

const FONT_5x7 = {
    'A': [0x04,0x0A,0x11,0x11,0x1F,0x11,0x11],
    'B': [0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
    'C': [0x0F,0x10,0x10,0x10,0x10,0x10,0x0F],
    'D': [0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],
    'E': [0x1F,0x10,0x10,0x1F,0x10,0x10,0x1F],
    'F': [0x1F,0x10,0x10,0x1F,0x10,0x10,0x10],
    'G': [0x0F,0x10,0x10,0x17,0x11,0x11,0x0F],
    'H': [0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
    'I': [0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
    'J': [0x07,0x02,0x02,0x02,0x02,0x12,0x0C],
    'K': [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
    'L': [0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
    'M': [0x11,0x1B,0x15,0x11,0x11,0x11,0x11],
    'N': [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
    'O': [0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
    'P': [0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
    'Q': [0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
    'R': [0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
    'S': [0x0F,0x10,0x10,0x0E,0x01,0x01,0x1E],
    'T': [0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
    'U': [0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
    'V': [0x11,0x11,0x11,0x11,0x11,0x0A,0x04],
    'W': [0x11,0x11,0x11,0x15,0x15,0x1B,0x11],
    'X': [0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
    'Y': [0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
    'Z': [0x1F,0x02,0x04,0x08,0x10,0x10,0x1F],
    '0': [0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],
    '1': [0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
    '2': [0x0E,0x11,0x02,0x04,0x08,0x10,0x1F],
    '3': [0x1F,0x02,0x04,0x0E,0x02,0x11,0x0E],
    '4': [0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
    '5': [0x1F,0x10,0x10,0x1E,0x01,0x01,0x1E],
    '6': [0x0E,0x11,0x10,0x1E,0x11,0x11,0x0E],
    '7': [0x1F,0x02,0x02,0x04,0x04,0x08,0x08],
    '8': [0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
    '9': [0x0E,0x11,0x11,0x0F,0x01,0x11,0x0E],
    ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    '?': [0x0E,0x11,0x02,0x04,0x04,0x00,0x04],
    '!': [0x04,0x04,0x04,0x04,0x04,0x00,0x04],
    '.': [0x00,0x00,0x00,0x00,0x00,0x00,0x04]
};

class TC002Emulator {
    constructor() {
        try {
            this.matrix = new Array(TOTAL_PIXELS).fill(null).map(() => ({ r: 0, g: 0, b: 0 }));
            this.ledElements = [];
            this.animationId = null;
            this.brightness = 1.0;
            this.dialRotation = 0;
            
            // Font and audio states
            this.fontSize = 'small';
            this.audioMute = false;
            this.audioCtx = null;
            this.micAnalyser = null;
            this.micStream = null;
            this.micDataArray = null;
            this.micSource = null;
            
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
            this.displayText('static');
        } catch (err) {
            console.error('Error during TC002Emulator initialization:', err);
        }
    }

    initAudio() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API is not supported in this environment', e);
        }
    }

    async startMicCapture() {
        this.initAudio();
        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.micAnalyser = this.audioCtx.createAnalyser();
            this.micAnalyser.fftSize = 128;
            
            this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
            this.micSource.connect(this.micAnalyser);
            
            const bufferLength = this.micAnalyser.frequencyBinCount;
            this.micDataArray = new Uint8Array(bufferLength);
            
            this.addLog('info', 'Physical microphone connected. Live audio oscilloscope active.');
        } catch (err) {
            console.warn('Physical microphone access denied. Falling back to simulation.', err);
            this.addLog('err', 'Microphone permission denied. Using virtual soundwave simulator.');
            this.micAnalyser = null;
            this.micStream = null;
        }
    }

    stopMicCapture() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        if (this.micSource) {
            this.micSource.disconnect();
            this.micSource = null;
        }
        this.micAnalyser = null;
        this.micDataArray = null;
        this.addLog('info', 'Physical microphone feed stopped.');
    }

    playClickSound(type) {
        if (this.audioMute) return;
        this.initAudio();
        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'tick') {
            // Knob rotation tick sound (extremely short high pitch burst)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.012);
            
            gainNode.gain.setValueAtTime(0.06, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
            
            osc.start(now);
            osc.stop(now + 0.012);
        } else if (type === 'click') {
            // Button click clack sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.03);
            
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === 'beep') {
            // Dial press confirmation beep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            osc.start(now);
            osc.stop(now + 0.08);
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

        // Font Size physical toggles binding
        const fontBtns = {
            'mini': document.getElementById('btnFontMini'),
            'small': document.getElementById('btnFontSmall'),
            'large': document.getElementById('btnFontLarge'),
            'huge': document.getElementById('btnFontHuge'),
            'giant': document.getElementById('btnFontGiant')
        };

        Object.keys(fontBtns).forEach(size => {
            const btn = fontBtns[size];
            if (btn) {
                btn.addEventListener('click', () => {
                    this.fontSize = size;
                    this.playClickSound('click');
                    
                    // Toggle active styles on buttons
                    Object.values(fontBtns).forEach(b => {
                        if (b) b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    
                    this.displayText('static');
                });
            }
        });

        // Live preview listeners for Text Generator inputs
        const liveControls = ['textInput', 'textColor', 'textEffect', 'bgMode', 'scrollSpeed'];
        liveControls.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const eventType = id === 'textInput' ? 'input' : 'change';
                el.addEventListener(eventType, () => {
                    this.displayText('static');
                });
            }
        });

        // Mute Audio toggle binding
        const btnMute = document.getElementById('btnAudioMute');
        if (btnMute) {
            btnMute.addEventListener('click', () => {
                this.audioMute = !this.audioMute;
                if (this.audioMute) {
                    btnMute.textContent = '🔇';
                    btnMute.title = 'Sound Muted (Click to unmute)';
                } else {
                    btnMute.textContent = '🔊';
                    btnMute.title = 'Sound Enabled (Mechanical feedback active)';
                    this.playClickSound('click');
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
                    this.playClickSound('click');
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
                    this.playClickSound('click');
                    this.flashCapActive('leftBtnCap');
                    this.sendKeyEvent(0x04); // Left
                    this.showOSD(() => this.drawArrowOSD(true));
                    break;
                case 'ArrowRight':
                    this.playClickSound('click');
                    this.flashCapActive('rightBtnCap');
                    this.sendKeyEvent(0x06); // Right
                    this.showOSD(() => this.drawArrowOSD(false));
                    break;
                case 'KeyM':
                    this.playClickSound('click');
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
        this.playClickSound('tick');
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
        this.playClickSound('beep');
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
        
        // Find the Mic Feed button using querySelector to bind .active class
        const micBtn = document.querySelector('button[onclick*="simulateMic"]');
        
        if (this.micInterval) {
            clearInterval(this.micInterval);
            this.micInterval = null;
        }

        if (this.hwState.mic.enabled) {
            if (micBtn) micBtn.classList.add('active');
            this.addLog('info', 'Microphone level telemetry feed started');
            this.playClickSound('beep');
            
            // Set initial telemetry values
            this.hwState.mic.level = 30;
            this.startMicCapture(); // Start actual physical microphone audio stream capture
            
            let count = 0;
            this.micInterval = setInterval(() => {
                let percent = 0;
                
                // If actual physical mic analyser node is hooked up
                if (this.micAnalyser && this.micDataArray) {
                    this.micAnalyser.getByteTimeDomainData(this.micDataArray);
                    
                    // Compute Root Mean Square (RMS) volume power
                    let sumSquares = 0;
                    for (let i = 0; i < this.micDataArray.length; i++) {
                        const val = (this.micDataArray[i] - 128) / 128; // scale from -1.0 to 1.0
                        sumSquares += val * val;
                    }
                    const rms = Math.sqrt(sumSquares / this.micDataArray.length);
                    // Map typical RMS values (maxing out around 0.5) to full 0-100 scale range
                    percent = Math.min(100, Math.floor(rms * 180));
                } else {
                    // Fallback to virtual soundwave simulation loop
                    count += 0.25;
                    percent = Math.floor(Math.abs(Math.sin(count)) * 75 + Math.random() * 25);
                }
                
                this.hwState.mic.level = percent; // Feed real/simulation volume amplitude
                this.addLog('ws-out', `Mic analog level telemetry: ${percent}%`);
                
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'telemetry',
                        sensor: 'mic',
                        value: percent,
                        timestamp: Date.now()
                    }));
                }
            }, 1000);
            this.displayText('static');
        } else {
            if (micBtn) micBtn.classList.remove('active');
            this.stopMicCapture(); // Terminate stream tracks cleanly
            this.hwState.mic.level = 0;
            this.addLog('info', 'Microphone telemetry feed stopped');
            this.playClickSound('click');
            this.displayText('static');
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

    drawBackground(step) {
        const bgModeSelect = document.getElementById('bgMode');
        const bgMode = bgModeSelect ? bgModeSelect.value : 'none';

        if (bgMode === 'none') {
            this.matrix.fill({ r: 0, g: 0, b: 0 });
        } else if (bgMode === 'rainbow') {
            const time = step * 0.015;
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const hue = (x / WIDTH + y / HEIGHT + time) % 1;
                    const rgb = this.hslToRgb(hue, 1, 0.5);
                    this.matrix[y * WIDTH + x] = {
                        r: Math.floor(rgb[0] * 0.28), // Dim to 28% for beautiful glow
                        g: Math.floor(rgb[1] * 0.28),
                        b: Math.floor(rgb[2] * 0.28)
                    };
                }
            }
        } else if (bgMode === 'matrix') {
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const rainFactor = (Math.sin(x * 0.5 + step * 0.1) * Math.cos(y * 0.2 + step * 0.05) + 1) / 2;
                    const greenVal = rainFactor > 0.72 ? Math.floor(120 * (rainFactor - 0.72) * 3.5) : 0;
                    this.matrix[y * WIDTH + x] = {
                        r: 0,
                        g: Math.floor(greenVal * 0.35), // Dim to 35% for clear visual raindrops
                        b: 0
                    };
                }
            }
        } else if (bgMode === 'starfield') {
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            const numStars = 12;
            for (let s = 0; s < numStars; s++) {
                const speed = 0.2 + (Math.sin(s * 45.2) * 0.08);
                const xVal = Math.floor((s * 17.5 - step * speed) % WIDTH + WIDTH) % WIDTH;
                const yVal = Math.floor(Math.abs(Math.sin(s * 82.1)) * HEIGHT) % HEIGHT;
                const brightness = Math.floor(120 + Math.sin(step * 0.1 + s) * 60);
                const index = yVal * WIDTH + xVal;
                this.matrix[index] = {
                    r: Math.floor(brightness * 0.28),
                    g: Math.floor(brightness * 0.28),
                    b: Math.floor(brightness * 0.38)
                };
            }
        } else if (bgMode === 'grid') {
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            for (let y = 8; y < HEIGHT; y++) {
                const lineSpacing = 8;
                const speedOffset = (step * 0.22) % lineSpacing;
                
                for (let x = 0; x < WIDTH; x++) {
                    const isHLine = (y - 8 + Math.floor(step * 0.08)) % 3 === 0;
                    const cx = WIDTH / 2;
                    const xRel = x - cx;
                    const angleFactor = xRel / (y - 6);
                    const isVLine = Math.floor(Math.abs(angleFactor * 12) + speedOffset) % lineSpacing === 0;
                    
                    if (isHLine || isVLine) {
                        const distFactor = (y - 7) / (HEIGHT - 7);
                        this.matrix[y * WIDTH + x] = {
                            r: Math.floor(120 * distFactor * 0.26), // Neon pink pinks
                            g: 0,
                            b: Math.floor(180 * distFactor * 0.32)
                        };
                    }
                }
            }
        } else if (bgMode === 'equalizer') {
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            for (let band = 0; band < 13; band++) {
                const xStart = band * 4;
                const hVal = Math.sin(band * 0.8 + step * 0.08) * Math.cos(band * 0.3 - step * 0.04) * 0.4 + 0.5;
                const height = Math.max(1, Math.min(10, Math.floor(hVal * 12)));
                
                for (let x = xStart; x < xStart + 3; x++) {
                    for (let y = HEIGHT - 1; y >= HEIGHT - height; y--) {
                        const index = y * WIDTH + x;
                        if (index >= 0 && index < TOTAL_PIXELS) {
                            let r = 0, g = 100, b = 0;
                            if (y < 4) { r = 100; g = 0; }
                            else if (y < 8) { r = 80; g = 80; }
                            
                            this.matrix[index] = {
                                r: Math.floor(r * 0.28),
                                g: Math.floor(g * 0.28),
                                b: Math.floor(b * 0.28)
                            };
                        }
                    }
                }
            }
        } else if (bgMode === 'lava') {
            const time = step * 0.02;
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const wave = Math.sin(x * 0.2 + time) * Math.cos(y * 0.35 - time * 0.8) + Math.sin(y * 0.1 + time);
                    const lavaVal = (wave + 2) / 4; 
                    this.matrix[y * WIDTH + x] = {
                        r: Math.floor((130 + lavaVal * 125) * 0.25), // Molten glow red
                        g: Math.floor((lavaVal * 80) * 0.15), // Dim orange yellow
                        b: 0
                    };
                }
            }
        } else if (bgMode === 'cyber') {
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const isDot = (x % 4 === 0) && (y % 3 === 0);
                    if (isDot) {
                        const sweep = Math.sin(x * 0.15 - step * 0.1) * Math.cos(y * 0.2 + step * 0.05);
                        if (sweep > 0.45) {
                            this.matrix[y * WIDTH + x] = {
                                r: 0,
                                g: Math.floor(100 * sweep * 0.25),
                                b: Math.floor(255 * sweep * 0.35) // Tech cyan dots
                            };
                        }
                    }
                }
            }
        }

        // Real-time Composite Soundwave Oscilloscope Wave Overlay when MIC is enabled
        if (this.hwState.mic.enabled) {
            const micLevel = this.hwState.mic.level || 30; 
            
            // Collect actual sound input signal array
            let waveData = new Array(WIDTH).fill(0);
            if (this.micAnalyser && this.micDataArray) {
                this.micAnalyser.getByteTimeDomainData(this.micDataArray);
                for (let x = 0; x < WIDTH; x++) {
                    // Normalize FFT time-domain values (128 is center flat zero)
                    const dataIdx = Math.floor((x / WIDTH) * this.micDataArray.length);
                    waveData[x] = (this.micDataArray[dataIdx] - 128) / 128;
                }
            } else {
                // Fallback simulation composite sine waves
                for (let x = 0; x < WIDTH; x++) {
                    waveData[x] = Math.sin(x * 0.35 + step * 0.45) * Math.cos(x * 0.12 - step * 0.22) * (micLevel / 100);
                }
            }

            const waveAmp = 6.5; // Max 6.5 pixels wave height scaling
            for (let x = 0; x < WIDTH; x++) {
                const waveY = Math.round(HEIGHT / 2 + waveData[x] * waveAmp);
                if (waveY >= 0 && waveY < HEIGHT) {
                    // Phosphor oscilloscope additive blending overlay
                    this.blendPixelAdditive(x, waveY, 10, 195, 25);
                    
                    // CRT phosphor glow halo blurs
                    this.blendPixelAdditive(x, waveY - 1, 2, 45, 5);
                    this.blendPixelAdditive(x, waveY + 1, 2, 45, 5);
                }
            }
        }
    }

    displayText(mode = 'static') {
        const textInput = document.getElementById('textInput');
        const colorSelect = document.getElementById('textColor');
        const textEffectSelect = document.getElementById('textEffect');
        const bgModeSelect = document.getElementById('bgMode');
        
        const text = textInput ? textInput.value || 'AGENT DECK' : 'AGENT DECK';
        const color = colorSelect ? colorSelect.value : '#ffffff';
        const textEffect = textEffectSelect ? textEffectSelect.value : 'static';
        const bgMode = bgModeSelect ? bgModeSelect.value : 'none';
        
        const size = this.fontSize; 
        const rgb = this.hexToRgb(color);

        if (this.animationId) cancelAnimationFrame(this.animationId);

        const chars = text.toUpperCase().split('');

        // Scalable Font Configuration
        const isMini = size === 'mini';
        const isSmall = size === 'small';
        const isLarge = size === 'large';
        const isHuge = size === 'huge';
        const isGiant = size === 'giant';

        // Select base maps
        const fontMap = isMini ? FONT_2x3 : (isSmall ? FONT_3x5 : FONT_5x7);
        const fontCols = isMini ? 2 : (isSmall ? 3 : 5);
        const fontRows = isMini ? 3 : (isSmall ? 5 : 7);
        const fontShift = isMini ? 1 : (isSmall ? 3 : 4);

        // Dynamically compute dot-matrix interpolation scaling factors
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (isHuge) { scaleX = 1.6; scaleY = 1.8; }
        if (isGiant) { scaleX = 2.0; scaleY = 2.2; }

        // Layout offset constraints
        const charWidth = isMini ? 3 : (isSmall ? 4 : (isLarge ? 6 : (isHuge ? 10 : 12)));
        const yOffset = isMini ? 6 : (isSmall ? 5 : (isLarge ? 4 : (isHuge ? 1 : 0)));

        const totalWidth = chars.length * charWidth - 1;
        
        // Scroll Speed Throttle
        const speedSelect = document.getElementById('scrollSpeed');
        const speed = speedSelect ? speedSelect.value : 'medium';
        let pixelsPerSecond = 14; 
        if (speed === 'fast') pixelsPerSecond = 28;
        if (speed === 'slow') pixelsPerSecond = 7;

        let scrollOffset = mode === 'scroll' ? WIDTH : Math.max(0, Math.floor((WIDTH - totalWidth) / 2));
        let step = 0;
        let lastTime = performance.now();

        const tick = () => {
            const now = performance.now();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;

            if (this.isOsdActive) {
                this.animationId = requestAnimationFrame(tick);
                return;
            }

            // 1. Draw Background
            this.drawBackground(step);
            step += deltaTime * 20;

            // 2. Update Scroll Offset
            if (mode === 'scroll') {
                scrollOffset -= deltaTime * pixelsPerSecond;
            }

            const roundedOffset = Math.round(scrollOffset);

            // 3. Draw Text
            chars.forEach((char, charIndex) => {
                const fontData = fontMap[char] || fontMap['?'];

                for (let row = 0; row < fontRows; row++) {
                    for (let col = 0; col < fontCols; col++) {
                        if (fontData[row] & (1 << (fontShift - col))) {
                            
                            // Map expansion scales for huge and giant fill modes
                            const startX = roundedOffset + charIndex * charWidth + Math.floor(col * scaleX);
                            const endX = roundedOffset + charIndex * charWidth + Math.floor((col + 1) * scaleX);
                            const startY = yOffset + Math.floor(row * scaleY);
                            const endY = yOffset + Math.floor((row + 1) * scaleY);

                            for (let px = startX; px < endX; px++) {
                                for (let py = startY; py < endY; py++) {
                                    
                                    let pixelRgb = { ...rgb };
                                    let renderX = px;
                                    let renderY = py;

                                    if (textEffect === 'rainbow') {
                                        const hue = (px / WIDTH + step * 0.02) % 1;
                                        const finalRgb = this.hslToRgb(hue, 1, 0.5);
                                        pixelRgb = { r: finalRgb[0], g: finalRgb[1], b: finalRgb[2] };
                                    } else if (textEffect === 'pulse') {
                                        const pulseFactor = 0.45 + Math.sin(step * 0.3) * 0.55;
                                        pixelRgb = {
                                            r: Math.floor(rgb.r * pulseFactor),
                                            g: Math.floor(rgb.g * pulseFactor),
                                            b: Math.floor(rgb.b * pulseFactor)
                                        };
                                    } else if (textEffect === 'bounce') {
                                        const waveOffset = Math.sin(px * 0.35 + step * 0.3) * 2.2;
                                        renderY = Math.round(py + waveOffset);
                                    } else if (textEffect === 'glitch') {
                                        const glitchActive = (Math.sin(step * 0.5) * Math.cos(step * 0.2) > 0.65);
                                        if (glitchActive) {
                                            const shift = Math.round(Math.sin(step * 1.8) * 1.5);
                                            renderX += shift;
                                        }
                                        if (Math.random() < 0.008) {
                                            pixelRgb = { r: 255, g: 255, b: 255 };
                                        }
                                    } else if (textEffect === 'fire') {
                                        // Accumulate additive flame convection embers over background
                                        let wasExtinguished = false;

                                        for (let fy = py; fy >= py - 3; fy--) {
                                            if (fy >= 0 && fy < HEIGHT) {
                                                const dist = py - fy;
                                                const flicker = Math.sin(px * 1.2 + fy * 0.8 + step * 0.5) * Math.cos(px * 0.7 - step * 0.3);
                                                
                                                let emberColor = { r: 0, g: 0, b: 0 };
                                                if (dist === 0) {
                                                    emberColor = { r: 255, g: 235, b: 180 }; // Core
                                                } else if (dist === 1 && flicker > -0.3) {
                                                    emberColor = { r: 245, g: 158, b: 11 }; // Yellow
                                                } else if (dist === 2 && flicker > 0.0) {
                                                    emberColor = { r: 239, g: 68, b: 68 }; // Red
                                                } else if (dist === 3 && flicker > 0.4) {
                                                    emberColor = { r: 100, g: 20, b: 20 }; // Ash
                                                } else {
                                                    continue;
                                                }
                                                
                                                // Blend Additive
                                                this.blendPixelAdditive(px, fy, emberColor.r, emberColor.g, emberColor.b);
                                            }
                                        }
                                        wasExtinguished = true;
                                        if (wasExtinguished) continue; 
                                    } else if (textEffect === 'matrixfall') {
                                        // Masked code rain blended with text colors at 40:60 ratio
                                        const codeFactor = (py + Math.floor(px * 0.8) - Math.floor(step * 6)) % 8;
                                        let codeColor = { r: 0, g: 20, b: 0 };
                                        
                                        if (codeFactor === 0) {
                                            codeColor = { r: 160, g: 255, b: 160 }; // Light drop
                                        } else if (codeFactor < 4) {
                                            const fade = (4 - codeFactor) / 4;
                                            codeColor = { r: 0, g: Math.floor(220 * fade), b: 0 };
                                        }
                                        
                                        pixelRgb = {
                                            r: Math.floor(rgb.r * 0.4 + codeColor.r * 0.6),
                                            g: Math.floor(rgb.g * 0.4 + codeColor.g * 0.6),
                                            b: Math.floor(rgb.b * 0.4 + codeColor.b * 0.6)
                                        };
                                    }

                                    if (renderX >= 0 && renderX < WIDTH && renderY >= 0 && renderY < HEIGHT) {
                                        // Blend text normally over backgrounds
                                        this.blendPixel(renderX, renderY, pixelRgb.r, pixelRgb.g, pixelRgb.b, 0.95);
                                    }
                                }
                            }
                        }
                    }
                }
            });

            this.render();

            const isScrollFinished = (mode === 'scroll' && scrollOffset + totalWidth < 0);
            const needsActiveLoop = (mode === 'scroll' || textEffect !== 'static' || bgMode !== 'none' || this.hwState.mic.enabled);

            if (needsActiveLoop && !isScrollFinished) {
                this.animationId = requestAnimationFrame(tick);
            } else {
                if (mode === 'scroll') {
                    this.addLog('info', 'Text scrolling finished');
                }
            }
        };

        tick();
        this.addLog('info', `${mode.toUpperCase()} text started: "${text}" (Effect: ${textEffect.toUpperCase()}, BG: ${bgMode.toUpperCase()})`);
    }

    blendPixel(x, y, r, g, b, alpha = 1.0) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
        const index = y * WIDTH + x;
        const bg = this.matrix[index] || { r: 0, g: 0, b: 0 };
        
        this.matrix[index] = {
            r: Math.min(255, Math.floor(bg.r * (1 - alpha) + r * alpha)),
            g: Math.min(255, Math.floor(bg.g * (1 - alpha) + g * alpha)),
            b: Math.min(255, Math.floor(bg.b * (1 - alpha) + b * alpha))
        };
    }

    blendPixelAdditive(x, y, r, g, b) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
        const index = y * WIDTH + x;
        const bg = this.matrix[index] || { r: 0, g: 0, b: 0 };
        
        this.matrix[index] = {
            r: Math.min(255, bg.r + r),
            g: Math.min(255, bg.g + g),
            b: Math.min(255, bg.b + b)
        };
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

    startDiagnosticsOSD() {
        this.addLog('info', 'Hardware self-diagnostics diagnostics active...');
        
        let step = 0;
        let lastTime = performance.now();
        let scrollOffset = WIDTH;
        
        const temp = (38 + Math.random() * 5).toFixed(1);
        const ram = Math.floor(62 + Math.random() * 15);
        const diagText = `SYS OK - TEMP: ${temp}C - RAM: ${ram}% - IP: 192.168.1.142 - UPT: ${Math.floor(performance.now()/1000)}S`;
        
        const diagLoop = () => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            if (!this.savedMatrix) {
                this.savedMatrix = this.matrix.map(pixel => ({ ...pixel }));
            }
            this.isOsdActive = true;
            
            // Draw background Matrix pattern (red/green scan lines)
            this.matrix.fill({ r: 0, g: 0, b: 0 });
            step += dt * 30;
            for (let y = 0; y < HEIGHT; y++) {
                const scanLine = Math.floor(step + y) % 6 === 0;
                if (scanLine) {
                    for (let x = 0; x < WIDTH; x++) {
                        this.matrix[y * WIDTH + x] = { r: 5, g: 15, b: 5 }; 
                    }
                }
            }

            // Draw diagnostic floating text in amber/red glow
            const chars = diagText.toUpperCase().split('');
            const fontMap = FONT_3x5;
            const charWidth = 4;
            const fontCols = 3;
            const fontRows = 5;
            const fontShift = 3;
            const yOffset = Math.floor(HEIGHT / 2) - 2;

            scrollOffset -= dt * 15; 

            chars.forEach((char, charIndex) => {
                const fontData = fontMap[char] || fontMap['?'];
                for (let row = 0; row < fontRows; row++) {
                    for (let col = 0; col < fontCols; col++) {
                        if (fontData[row] & (1 << (fontShift - col))) {
                            const x = Math.round(scrollOffset) + charIndex * charWidth + col;
                            const y = yOffset + row;
                            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                                this.matrix[y * WIDTH + x] = { r: 245, g: 130, b: 10 };
                            }
                        }
                    }
                }
            });

            this.render();

            if (scrollOffset + chars.length * charWidth > 0) {
                this.animationId = requestAnimationFrame(diagLoop);
            } else {
                if (this.savedMatrix) {
                    this.matrix = this.savedMatrix.map(pixel => ({ ...pixel }));
                    this.savedMatrix = null;
                }
                this.isOsdActive = false;
                this.render();
                this.addLog('info', 'Hardware self-diagnostics completed. Restored displays.');
                
                this.displayText('static');
            }
        };

        if (this.animationId) cancelAnimationFrame(this.animationId);
        diagLoop();
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
}

// Initialize and expose to window when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.emulator = new TC002Emulator();
    });
} else {
    window.emulator = new TC002Emulator();
}
