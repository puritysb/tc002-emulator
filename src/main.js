// TC002 Emulator with Hardware Status Simulation

const WIDTH = 52;
const HEIGHT = 16;
const TOTAL_PIXELS = WIDTH * HEIGHT;

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

        // Hardware state
        this.hwState = {
            mcu: { connected: true, version: 'v1.0.2' },
            wifi: { connected: true },
            ble: { advertising: true },
            mic: { level: 0, enabled: false },
            knob: { state: 'idle' }
        };

        this.initMatrix();
        this.initControls();
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
        // Brightness
        const brightnessSlider = document.getElementById('brightness');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                this.brightness = e.target.value / 100;
                const label = document.getElementById('brightnessValue');
                if (label) label.textContent = e.target.value + '%';
                this.render();
            });
        }

        // File input
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
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

        // Text input enter key
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.displayText('static');
                }
            });
        }
    }

    // Hardware simulation methods
    simulateMic() {
        this.hwState.mic.enabled = !this.hwState.mic.enabled;
        if (this.hwState.mic.enabled) {
            // Animate MIC level
            let time = 0;
            const animate = () => {
                if (!this.hwState.mic.enabled) {
                    this.updateHwStatus();
                    return;
                }
                time += 0.1;
                const level = Math.abs(Math.sin(time)) * 100;
                this.hwState.mic.level = Math.floor(level);
                this.updateHwStatus();
                requestAnimationFrame(() => setTimeout(animate, 100));
            };
            animate();
        }
    }

    toggleWifi() {
        this.hwState.wifi.connected = !this.hwState.wifi.connected;
        // BLE depends on WiFi
        if (!this.hwState.wifi.connected) {
            this.hwState.ble.advertising = false;
        }
        this.updateHwStatus();
    }

    toggleBle() {
        if (this.hwState.wifi.connected) {
            this.hwState.ble.advertising = !this.hwState.ble.advertising;
        }
        this.updateHwStatus();
    }

    updateHwStatus() {
        // MCU
        const mcuInd = document.getElementById('mcuIndicator');
        const mcuStatus = document.getElementById('mcuStatus');
        if (mcuInd && mcuStatus) {
            if (this.hwState.mcu.connected) {
                mcuInd.className = 'hw-indicator on';
                mcuStatus.textContent = 'Connected';
                mcuStatus.className = 'hw-value on';
            } else {
                mcuInd.className = 'hw-indicator error';
                mcuStatus.textContent = 'Disconnected';
                mcuStatus.className = 'hw-value error';
            }
        }

        // WiFi
        const wifiInd = document.getElementById('wifiIndicator');
        const wifiStatus = document.getElementById('wifiStatus');
        if (wifiInd && wifiStatus) {
            if (this.hwState.wifi.connected) {
                wifiInd.className = 'hw-indicator on';
                wifiStatus.textContent = 'Connected';
                wifiStatus.className = 'on';
            } else {
                wifiInd.className = 'hw-indicator';
                wifiStatus.textContent = 'Disconnected';
                wifiStatus.className = '';
            }
        }

        // BLE
        const bleInd = document.getElementById('bleIndicator');
        const bleStatus = document.getElementById('bleStatus');
        if (bleInd && bleStatus) {
            if (this.hwState.ble.advertising) {
                bleInd.className = 'hw-indicator on';
                bleStatus.textContent = 'Advertising';
            } else {
                bleInd.className = 'hw-indicator';
                bleStatus.textContent = this.hwState.wifi.connected ? 'Off' : 'N/A (WiFi off)';
            }
        }

        // MIC
        const micBar = document.getElementById('micBar');
        const micValue = document.getElementById('micValue');
        if (micBar && micValue) {
            micBar.style.width = this.hwState.mic.level + '%';
            micValue.textContent = this.hwState.mic.level + '%';
        }
    }

    loadImage(file) {
        const img = new Image();
        img.onload = () => this.drawImageToMatrix(img);
        img.src = URL.createObjectURL(file);
        const dropZone = document.getElementById('dropZone');
        if (dropZone) dropZone.classList.add('active');
        this.updateStatus('Image loaded');
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
        const color = colorSelect ? colorSelect.value : '#3b82f6';

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
        } else if (effect === 'blink') {
            this.blinkText(color);
        } else {
            this.render();
            this.updateStatus(`Static: "${text}"`);
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
                this.updateStatus('Scroll complete');
            }
        };

        if (this.animationId) cancelAnimationFrame(this.animationId);
        scroll();
        this.updateStatus('Scrolling...');
    }

    blinkText(color) {
        const rgb = this.hexToRgb(color);
        let visible = true;

        const blink = () => {
            if (visible) {
                const textInput = document.getElementById('textInput');
                this.displayText('static');
            } else {
                this.matrix.fill({ r: 0, g: 0, b: 0 });
                this.render();
            }
            visible = !visible;
            this.animationId = requestAnimationFrame(() => setTimeout(() => blink(), 400));
        };

        if (this.animationId) cancelAnimationFrame(this.animationId);
        blink();
        this.updateStatus('Blinking...');
    }

    startAnimation(type) {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        const animations = {
            rainbow: () => this.rainbowAnimation(),
            wave: () => this.waveAnimation(),
            matrix: () => this.matrixAnimation(),
            fire: () => this.fireAnimation(),
            snow: () => this.snowAnimation()
        };

        if (animations[type]) {
            animations[type]();
            this.updateStatus(`Animation: ${type}`);
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.matrix.fill({ r: 0, g: 0, b: 0 });
        this.render();
        this.updateStatus('Stopped');
    }

    rainbowAnimation() {
        let time = 0;
        const animate = () => {
            time += 0.02;
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const hue = (x / WIDTH + y / HEIGHT + time) % 1;
                    const rgb = this.hslToRgb(hue, 1, 0.5);
                    this.setPixel(x, y, rgb[0], rgb[1], rgb[2]);
                }
            }
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    waveAnimation() {
        let time = 0;
        const animate = () => {
            time += 0.05;
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const wave = Math.sin((x / WIDTH * Math.PI * 2) + time) * 0.5 + 0.5;
                    const hue = 0.6 + wave * 0.1;
                    const lightness = 0.3 + wave * 0.4;
                    const rgb = this.hslToRgb(hue, 0.8, lightness);
                    this.setPixel(x, y, rgb[0], rgb[1], rgb[2]);
                }
            }
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    matrixAnimation() {
        const columns = new Array(WIDTH).fill(0).map(() => ({
            y: Math.random() * -10,
            speed: 0.1 + Math.random() * 0.2,
            length: 3 + Math.floor(Math.random() * 5)
        }));

        const animate = () => {
            for (let i = 0; i < TOTAL_PIXELS; i++) {
                this.matrix[i] = {
                    r: Math.max(0, this.matrix[i].r - 8),
                    g: Math.max(0, this.matrix[i].g - 8),
                    b: Math.max(0, this.matrix[i].b - 8)
                };
            }

            columns.forEach((col, idx) => {
                const y = Math.floor(col.y);
                for (let i = 0; i < col.length; i++) {
                    const py = y - i;
                    if (py >= 0 && py < HEIGHT) {
                        const brightness = 1 - (i / col.length);
                        const index = py * WIDTH + idx;
                        this.matrix[index] = { r: 0, g: Math.floor(200 * brightness), b: 0 };
                    }
                }
                col.y += col.speed;
                if (col.y > HEIGHT + col.length) col.y = -col.length;
            });

            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    fireAnimation() {
        const heat = new Array(WIDTH).fill(0).map(() => new Array(HEIGHT).fill(0));
        const animate = () => {
            for (let x = 0; x < WIDTH; x++) {
                for (let y = 1; y < HEIGHT; y++) {
                    heat[x][y] = Math.max(0, heat[x][y] - Math.random() * 3);
                }
            }

            for (let x = 0; x < WIDTH; x++) {
                for (let y = HEIGHT - 2; y >= 0; y--) {
                    const spread = Math.floor(Math.random() * 3) - 1;
                    const targetX = Math.max(0, Math.min(WIDTH - 1, x + spread));
                    heat[targetX][y + 1] = Math.max(heat[targetX][y + 1], heat[x][y] * 0.9);
                }
            }

            for (let x = 0; x < WIDTH; x++) {
                if (Math.random() > 0.5) heat[x][0] = 200 + Math.random() * 55;
            }

            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const rgb = this.heatToRgb(heat[x][y]);
                    this.setPixel(x, y, rgb[0], rgb[1], rgb[2]);
                }
            }

            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    snowAnimation() {
        const flakes = [];
        for (let i = 0; i < 40; i++) {
            flakes.push({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                speed: 0.05 + Math.random() * 0.1
            });
        }

        const animate = () => {
            this.matrix.fill({ r: 0, g: 0, b: 0 });

            flakes.forEach(flake => {
                const x = Math.floor(flake.x);
                const y = Math.floor(flake.y);

                if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                    const brightness = 180 + Math.random() * 75;
                    this.matrix[y * WIDTH + x] = { r: brightness, g: brightness, b: brightness };
                }

                flake.y += flake.speed;
                flake.x += Math.sin(flake.y * 0.1) * 0.2;

                if (flake.y >= HEIGHT) {
                    flake.y = 0;
                    flake.x = Math.random() * WIDTH;
                }
            });

            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    loadSampleImage(type) {
        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');

        switch (type) {
            case 'gradient':
                const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
                grad.addColorStop(0, '#3b82f6');
                grad.addColorStop(0.5, '#a855f7');
                grad.addColorStop(1, '#ef4444');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                break;
            case 'checker':
                const size = 4;
                for (let y = 0; y < HEIGHT; y += size) {
                    for (let x = 0; x < WIDTH; x += size) {
                        ctx.fillStyle = ((x / size + y / size) % 2) ? '#3b82f6' : '#1a1a2e';
                        ctx.fillRect(x, y, size, size);
                    }
                }
                break;
            case 'smile':
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(WIDTH / 2, HEIGHT / 2, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.fillRect(WIDTH / 2 - 2, HEIGHT / 2 - 1, 1, 1);
                ctx.fillRect(WIDTH / 2 + 1, HEIGHT / 2 - 1, 1, 1);
                ctx.beginPath();
                ctx.arc(WIDTH / 2, HEIGHT / 2, 4, 0.2, Math.PI - 0.2);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.5;
                ctx.stroke();
                break;
        }

        const img = new Image();
        img.onload = () => this.drawImageToMatrix(img);
        img.src = canvas.toDataURL();
        this.updateStatus(`Sample: ${type}`);
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
            const brightness = (r + g + b) / 765;

            led.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

            if (brightness > 0.3) {
                led.style.boxShadow = `0 0 ${brightness * 3}px rgb(${r}, ${g}, ${b})`;
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

    heatToRgb(h) {
        h = Math.min(255, h);
        if (h < 64) return [h * 4, 0, 0];
        if (h < 128) return [255, (h - 64) * 4, 0];
        if (h < 192) return [255, 255, (h - 128) * 4];
        return [255, 255, 255];
    }

    updateStatus(text) {
        const statusEl = document.getElementById('statusText');
        if (statusEl) statusEl.textContent = text;
    }
}

// Initialize and expose to window
window.emulator = new TC002Emulator();
