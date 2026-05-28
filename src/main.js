// TC002 Emulator - Web-based 52x16 LED Matrix

const WIDTH = 52;
const HEIGHT = 16;
const TOTAL_PIXELS = WIDTH * HEIGHT;
const FRAME_INTERVAL_MS = 15;

class TC002Emulator {
    constructor() {
        this.matrix = new Array(TOTAL_PIXELS).fill(null).map(() => ({ r: 0, g: 0, b: 0 }));
        this.ledElements = [];
        this.ws = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsLastUpdate = 0;

        this.initMatrix();
        this.initControls();
    }

    initMatrix() {
        const matrixEl = document.getElementById('matrix');
        matrixEl.innerHTML = '';

        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const led = document.createElement('div');
            led.className = 'led';
            led.dataset.index = i;
            matrixEl.appendChild(led);
            this.ledElements.push(led);
        }
    }

    initControls() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('testBtn').addEventListener('click', () => this.testPattern());

        // Knob and buttons
        document.getElementById('knobCw').addEventListener('click', () => this.sendKeyEvent(0x01));
        document.getElementById('knobCcw').addEventListener('click', () => this.sendKeyEvent(0x02));
        document.getElementById('knobPress').addEventListener('click', () => this.sendKeyEvent(0x03));
        document.getElementById('btnLeft').addEventListener('click', () => this.sendKeyEvent(0x04));
        document.getElementById('btnMid').addEventListener('click', () => this.sendKeyEvent(0x05));
        document.getElementById('btnRight').addEventListener('click', () => this.sendKeyEvent(0x06));
    }

    connect() {
        const url = document.getElementById('wsUrl').value;

        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            document.getElementById('wsDot').classList.add('connected');
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            document.getElementById('wsDot').classList.remove('connected');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'frame':
                    this.setFrame(message.data);
                    break;
                case 'clear':
                    this.clear();
                    break;
                case 'test':
                    this.testPattern();
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    }

    sendKeyEvent(keyCode) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'key',
                code: keyCode,
                timestamp: Date.now()
            }));
        } else {
            console.log('Key event (not connected):', keyCode);
        }
    }

    setFrame(rgbData) {
        // rgbData is Uint8Array or array of length TOTAL_PIXELS * 3
        // Format: R,G,B per pixel, row-major order
        for (let i = 0; i < TOTAL_PIXELS; i++) {
            const offset = i * 3;
            this.matrix[i] = {
                r: rgbData[offset],
                g: rgbData[offset + 1],
                b: rgbData[offset + 2]
            };
        }
        this.render();
    }

    setPixel(x, y, r, g, b) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
        const index = y * WIDTH + x;
        this.matrix[index] = { r, g, b };
        this.updateLed(index);
    }

    clear() {
        this.matrix.fill({ r: 0, g: 0, b: 0 });
        this.render();
    }

    testPattern() {
        // Rainbow gradient
        const time = Date.now() / 1000;

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const hue = (x / WIDTH + y / HEIGHT + time) % 1;
                const rgb = this.hslToRgb(hue, 1, 0.5);
                this.setPixel(x, y, rgb[0], rgb[1], rgb[2]);
            }
        }

        // Animate
        const animate = () => {
            if (this.isTestRunning) return;
            this.isTestRunning = true;

            const frame = () => {
                const t = Date.now() / 1000;
                for (let y = 0; y < HEIGHT; y++) {
                    for (let x = 0; x < WIDTH; x++) {
                        const hue = (x / WIDTH + y / HEIGHT + t * 0.5) % 1;
                        const rgb = this.hslToRgb(hue, 1, 0.5);
                        this.setPixel(x, y, rgb[0], rgb[1], rgb[2]);
                    }
                }
                this.testAnimationId = requestAnimationFrame(frame);
            };
            frame();
        };

        if (this.testAnimationId) {
            cancelAnimationFrame(this.testAnimationId);
            this.testAnimationId = null;
            this.isTestRunning = false;
        } else {
            this.isTestRunning = false;
            animate();
        }
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

    render() {
        const now = performance.now();

        // Throttle to minimum frame interval
        if (now - this.lastFrameTime < FRAME_INTERVAL_MS) {
            return;
        }

        this.lastFrameTime = now;
        this.frameCount++;

        // Update FPS counter every second
        if (now - this.fpsLastUpdate >= 1000) {
            document.getElementById('fpsCounter').textContent = `${this.frameCount} FPS`;
            this.frameCount = 0;
            this.fpsLastUpdate = now;
        }

        // Update all LEDs
        for (let i = 0; i < TOTAL_PIXELS; i++) {
            this.updateLed(i);
        }
    }

    updateLed(index) {
        const led = this.ledElements[index];
        const color = this.matrix[index];
        const brightness = (color.r + color.g + color.b) / 765;
        led.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

        // Add glow for bright pixels
        if (brightness > 0.5) {
            led.style.boxShadow = `0 0 ${brightness * 4}px rgb(${color.r}, ${color.g}, ${color.b})`;
        } else {
            led.style.boxShadow = 'none';
        }
    }
}

// Initialize on load
const emulator = new TC002Emulator();
