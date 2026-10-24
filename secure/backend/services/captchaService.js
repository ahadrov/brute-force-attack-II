import crypto from 'crypto'

// In-memory store for active CAPTCHA challenges
const captchaStore = new Map()

// Clean up expired CAPTCHAs every 60 seconds
setInterval(() => {
    const now = Date.now()
    for (const [id, data] of captchaStore.entries()) {
        if (data.expiresAt < now) {
            captchaStore.delete(id)
        }
    }
}, 60 * 1000)

/**
 * Generates an SVG-based CAPTCHA challenge without external dependencies.
 */
export function generateCaptcha() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // excludes easily confused characters (0, O, 1, I)
    let text = ''
    for (let i = 0; i < 5; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const captchaId = crypto.randomUUID()
    captchaStore.set(captchaId, {
        text: text.toUpperCase(),
        expiresAt: Date.now() + 5 * 60 * 1000 // 5-minute lifespan
    })

    const width = 160
    const height = 48
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    svgContent += `<rect width="${width}" height="${height}" fill="#141824" rx="8" />`

    // Noise wave lines
    const strokeColors = ['#00e5ff', '#38ef7d', '#ff007f', '#a855f7', '#ffb703']
    for (let i = 0; i < 4; i++) {
        const x1 = Math.floor(Math.random() * width)
        const y1 = Math.floor(Math.random() * height)
        const x2 = Math.floor(Math.random() * width)
        const y2 = Math.floor(Math.random() * height)
        const color = strokeColors[i % strokeColors.length]
        svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="0.45" />`
    }

    // Noise dots
    for (let i = 0; i < 35; i++) {
        const cx = Math.floor(Math.random() * width)
        const cy = Math.floor(Math.random() * height)
        svgContent += `<circle cx="${cx}" cy="${cy}" r="1" fill="#ffffff" opacity="0.35" />`
    }

    // Distorted characters
    const textColors = ['#00f2fe', '#4facfe', '#00ff87', '#60efff', '#ffdd53']
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const x = 20 + i * 26
        const y = 32 + (Math.random() * 6 - 3)
        const rot = Math.floor(Math.random() * 26) - 13
        const color = textColors[i % textColors.length]
        svgContent += `<text x="${x}" y="${y}" font-family="monospace, sans-serif" font-weight="900" font-size="24" fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`
    }

    svgContent += `</svg>`

    return {
        captchaId,
        captchaSvg: svgContent
    }
}

/**
 * Validates a submitted CAPTCHA response.
 * Single-use: once checked, it is destroyed to prevent replay attacks.
 */
export function verifyCaptcha(captchaId, answer) {
    if (!captchaId || !answer) return false
    const entry = captchaStore.get(captchaId)
    if (!entry) return false
    if (entry.expiresAt < Date.now()) {
        captchaStore.delete(captchaId)
        return false
    }

    // Burn token to prevent replay
    captchaStore.delete(captchaId)
    return entry.text === answer.trim().toUpperCase()
}
