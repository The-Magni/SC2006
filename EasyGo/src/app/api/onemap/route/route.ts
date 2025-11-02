import { NextResponse } from "next/server"
import { loadToken, refreshToken, saveToken } from "@/lib/onemap/tokenCache"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const routeType = searchParams.get("routeType") || "pt"
    const date = searchParams.get("date")
    const time = searchParams.get("time")
    const mode = searchParams.get("mode")

    if (!start || !end) {
      return NextResponse.json({ error: "Missing start or end parameters" }, { status: 400 })
    }

    // Load token
    let tokenData = loadToken()
    if (!tokenData?.access_token) {
      console.warn("⚙️ Token missing or expired, refreshing...")
      try {
        tokenData = await refreshToken()
        saveToken(tokenData)
      } catch (err) {
        console.error("Token refresh failed:", err)
        return NextResponse.json({ error: "Token refresh failed" }, { status: 500 })
      }
    }

    const token = tokenData?.access_token
    if (!token) {
      return NextResponse.json({ error: "Missing OneMap access token" }, { status: 401 })
    }

    const base = "https://www.onemap.gov.sg/api/public/routingsvc/route"
    const params = new URLSearchParams()
    params.set("start", start)
    params.set("end", end)
    params.set("routeType", routeType)
    params.set("numItineraries", "5")

    if (routeType === "pt") {
      if (date) params.set("date", date)
      if (time) params.set("time", time)
      params.set("mode", mode ?? "TRANSIT")
      params.set("maxWalkDistance", "2000")
    }

    const url = `${base}?${params.toString()}`
    console.log("🛰️ Calling OneMap:", url)

    const res = await fetch(url, {
      headers: { Authorization: token },
    })

    const text = await res.text()

    if (!res.ok) {
      console.error(`OneMap API failed: ${res.status} → ${text}`)

      // If unauthorized → retry
      if (res.status === 401) {
        console.log("Retrying after refreshing token...")
        const newToken = await refreshToken()
        saveToken(newToken)

        const retry = await fetch(url, {
          headers: { Authorization: newToken.access_token },
        })
        const retryText = await retry.text()
        if (retry.ok) {
          console.log("Retry successful.")
          return NextResponse.json(JSON.parse(retryText))
        }
        console.error("Retry failed:", retryText)
        return NextResponse.json({ error: retryText }, { status: retry.status })
      }


      return NextResponse.json({ error: text }, { status: res.status })
    }

    // If success
    console.log("OneMap response received successfully.")
    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    if (err instanceof Error) {
      console.error("Route API error:", err)
      return NextResponse.json({ error: err.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown' }, { status: 500});
    }
  }
}
