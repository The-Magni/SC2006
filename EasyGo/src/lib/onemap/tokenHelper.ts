let token: string | null = null
let expiryTimestamp: number | null = null // in seconds

export async function getServerToken(): Promise<string> {
  if (token && expiryTimestamp && Date.now() / 1000 < expiryTimestamp - 300) {
    return token // return existing, refresh 5min before expiry
  }

  const refreshed = await refreshServerToken()
  if (!refreshed) throw new Error("Failed to refresh token")
  return refreshed
}

async function refreshServerToken(): Promise<string | null> {
  try {
    const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ONEMAP_EMAIL,
        password: process.env.ONEMAP_EMAIL_PASSWORD,
      }),
    })

    if (!res.ok) throw new Error(`Failed to refresh token: ${res.status}`)
    const data = await res.json()

    token = data.access_token
    expiryTimestamp = data.expiry_timestamp
    console.log("Server refreshed token")
    return token
  } catch (err) {
    console.error("token refresh error:", err)
    return null
  }
}
