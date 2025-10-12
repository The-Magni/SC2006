// app/api/onemap/route/route.ts
import { NextResponse } from "next/server"

const BASE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const routeType = searchParams.get("routeType") || "pt"
  const date = searchParams.get("date") || "08-13-2023"
  const time = searchParams.get("time") || "07:35:00"
  const mode = searchParams.get("mode") || "TRANSIT"
  const maxWalkDistance = searchParams.get("maxWalkDistance") || "1000"
  const numItineraries = searchParams.get("numItineraries") || "3"

  const token = process.env.NEXT_PUBLIC_ONEMAP_API_KEY
  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 })
  }

  const url = `${BASE_URL}?start=${start}&end=${end}&routeType=${routeType}&date=${date}&time=${time}&mode=${mode}&maxWalkDistance=${maxWalkDistance}&numItineraries=${numItineraries}`

  try {
    const res = await fetch(url, {
      headers: { Authorization: token },
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("OneMap proxy error:", err)
    return NextResponse.json({ error: "Failed to reach OneMap" }, { status: 500 })
  }
}
