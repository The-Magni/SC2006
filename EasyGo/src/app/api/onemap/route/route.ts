import { NextResponse } from "next/server"
import { loadToken, saveToken, refreshToken } from "@/lib/onemap/tokenCache"

/**
 * Automatically fetches route data from OneMap.
 * If the token is missing or invalid, it will refresh automatically.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const routeType = searchParams.get("routeType") || "pt"

    if (!start || !end) {
      return NextResponse.json({ error: "Missing start or end parameters" }, { status: 400 })
    }

    let tokenData = loadToken()
    if (!tokenData?.access_token) {
      console.log("No valid token found, refreshing...")
      tokenData = await refreshToken()
      saveToken(tokenData)
    }

    const queryString = searchParams.toString()
    const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?${queryString}`

    console.log("Fetching OneMap route:", routeType)
    console.log(url)

    let res = await fetch(url, {
      headers: { Authorization: tokenData.access_token },
    })

    if (res.status === 401) {
      console.warn("Token expired — refreshing and retrying...")
      tokenData = await refreshToken()
      saveToken(tokenData)

      // Retry with new token
      res = await fetch(url, {
        headers: { Authorization: tokenData.access_token },
      })
    }

    if (!res.ok) {
      const text = await res.text()
      console.error(` OneMap API failed (${res.status}):`, text)
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("Route API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
