import fs from "fs"
import path from "path"

const TOKEN_PATH = path.join(process.cwd(), "lib/onemap/token.json")

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

export function loadToken() {
  try {
    if (!fs.existsSync(TOKEN_PATH)) return null
    const data = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"))

    const now = Date.now()
    if (now - (data.created_at || 0) > TOKEN_EXPIRY_MS) {
      console.log("Token expired, needs refresh")
      return null
    }

    return data
  } catch (err) {
    console.error("Failed to load token:", err)
    return null
  }
}

export function saveToken(tokenData: any) {
  try {
    const enriched = {
      ...tokenData,
      created_at: Date.now(),
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(enriched, null, 2), "utf8")
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

    const data = await res.json()
    saveToken(data)
    return data
  } catch (err) {
    console.error("Token refresh error:", err)
    throw err
  }
}
