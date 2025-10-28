import fs from "fs"
import path from "path"

const TOKEN_PATH = path.join(process.cwd(), "lib/onemap/token.json")

export interface TokenData {
    access_token: string
    expiry_timestamp: number
}

export function loadToken() {
    try {
        if (!fs.existsSync(TOKEN_PATH)) return null
        const data = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"))

        const now = Math.floor(Date.now() / 1000)
        if (now >= data.expiry_timestamp) {
            console.log(`Token expired (${data.expiry_timestamp}) > ${now}, needs refresh"`)
            return null
        }
        return data

    } catch (err) {
        console.error("Failed to load token from file:", err)
        return null
    }
}

export function saveToken(token: TokenData) {
    try {
        const dir = path.dirname(TOKEN_PATH)

        // Create directory if missing
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        //Write token file
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), "utf8")
        console.log("Token saved to:", TOKEN_PATH)
    } catch (err) {
        console.error("Failed to save token:", err)
    }
}

export async function refreshToken() {
    try {
        const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: process.env.ONEMAP_EMAIL,
                password: process.env.ONEMAP_EMAIL_PASSWORD,
            }),
        })

        if (!res.ok) {
            const errText = await res.text()
            throw new Error(`Token refresh failed: ${res.status} → ${errText}`)
        }

        const data = await res.json() as TokenData

        saveToken(data)
        return data

    } catch (err) {
        console.error("Token refresh error:", err)
        throw err
    }
}
