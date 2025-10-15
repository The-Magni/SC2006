import fs from "fs"
import path from "path"

const TOKEN_PATH = path.resolve(process.cwd(), "lib/onemap/token.json")

export function loadToken() {
  try {
    if (!fs.existsSync(TOKEN_PATH)) return null
    const data = fs.readFileSync(TOKEN_PATH, "utf-8")
    const parsed = JSON.parse(data)
    if (parsed.expiry && Date.now() > parsed.expiry) return null // expired
    return parsed
  } catch {
    return null
  }
}

export function saveToken(data: any) {
  try {
    if (data) fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error("Failed to save token:", err)
  }
}

/** Refreshes the OneMap token using credentials in .env */
export async function refreshToken() {
  try {
    const url = "https://www.onemap.gov.sg/api/auth/post/getToken"
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ONEMAP_EMAIL,
        password: process.env.ONEMAP_PASSWORD,
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    data.expiry = Date.now() + 24 * 60 * 60 * 1000 // valid for 24h
    return data
  } catch (err) {
    console.error("Token refresh error:", err)
    throw err
  }
}
