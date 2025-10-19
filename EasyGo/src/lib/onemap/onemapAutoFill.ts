export interface OneMapSearchResult {
  SEARCHVAL: string
  BLK_NO: string
  ROAD_NAME: string
  BUILDING: string
  ADDRESS: string
  POSTAL: string
  X: string
  Y: string
  LATITUDE: string
  LONGITUDE: string
}

export async function fetchResults(query: string) {
  if (!query || query.trim().length < 2) return []

  try {
    const res = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
        query
      )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
    )

    if (!res.ok) throw new Error(`Search failed: ${res.status}`)

    const data = await res.json()
    return data.results || []
  } catch (err) {
    console.error("Search error:", err)
    return []
  }
}