# TC002 Emulator

Web-based emulator for Ulanzi TC002 52×16 RGB LED matrix.

## Features

- 52×16 LED matrix visualization (832 pixels)
- WebSocket for real-time frame updates
- Frame rate limiting (≥15ms interval, matching hardware)
- Knob and button event simulation
- Cross-platform (web-based)

## Hardware Reference

**TC002 Specifications:**
- SoC: Z21 series (Linux-based)
- Display: 52×16 RGB LED matrix, SPI-driven
- Input: 1 encoder (knob) + 3 buttons
- Audio: Speaker + MP3 + MIC
- Wireless: Wi-Fi + BLE
- MCU UART: `/dev/ttyS1` @ 1500000 baud

## Protocol

### Frame Data

Send RGB data as `Uint8Array` or base64:

```json
{
    "type": "frame",
    "data": [/* 52*16*3 bytes: R,G,B per pixel, row-major */]
}
```

### Key Events

```json
{
    "type": "key",
    "code": 0x01,  // 0x01=CW, 0x02=CCW, 0x03=KnobPress, 0x04=Left, 0x05=Mid, 0x06=Right
    "timestamp": 1717012800000
}
```

## Development

```bash
cd tools/tc002-emulator
pnpm install
pnpm dev
```

Visit https://localhost:54200

## Integration with AgentDeck

The emulator can be used to test AgentDeck's TC002 rendering without physical hardware:

```typescript
// bridge/src/pixoo.ts-style adapter for TC002
async function sendFrameToEmulator(rgbData: Uint8Array) {
    const ws = new WebSocket('ws://localhost:54200');
    await new Promise(resolve => ws.onopen = resolve);
    ws.send(JSON.stringify({ type: 'frame', data: Array.from(rgbData) }));
}
```

## Roadmap

- [ ] MCU protocol simulation (UART bridge)
- [ ] BLE pairing simulation
- [ ] Audio playback/MIC simulation
- [ ] AgentDeck daemon integration

## License

MIT (for emulator code only)
TC002 firmware and SDK are GPL-3.0-or-later
