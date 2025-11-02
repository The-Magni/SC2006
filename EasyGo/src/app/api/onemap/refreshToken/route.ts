import { NextResponse } from "next/server"
import { saveToken } from "@/lib/onemap/tokenCache"


export async function GET() {
  try {
    const email = process.env.ONEMAP_EMAIL
    const password = process.env.ONEMAP_EMAIL_PASSWORD

    if (!email || !password) {
      throw new Error("Missing ONEMAP_EMAIL or ONEMAP_EMAIL_PASSWORD in environment.")
    }

    console.log("Requesting new OneMap token...")

    const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OneMap auth failed (${res.status}): ${text}`)
    }

    const data = await res.json()

    if (!data.access_token) {
      throw new Error("No access_token in OneMap response.")
    }

    const expiry_timestamp = Date.now() + 24 * 60 * 60 * 1000

    const tokenData = {
      access_token: data.access_token,
      expiry_timestamp,
    }

    saveToken(tokenData)

    console.log("Token refreshed and cached")

    return NextResponse.json(tokenData, { status: 200 })
  } catch (err) {
    if (err instanceof Error) {
      console.error("Token refresh error:", err)
      return NextResponse.json(
        { error: err.message ?? "Unknown token refresh error" },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        {error: 'Unknown'},
        { status: 500}
      );
    }
  }
}
