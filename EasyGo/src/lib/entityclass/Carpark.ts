export class Carpark {
  id: string
  name: string
  lat: number
  lng: number
  availableLots?: number

  constructor(data: {
    id: string
    name: string
    lat: number
    lng: number
    availableLots?: number
    totalLots?: number
  }) {
    this.id = data.id
    this.name = data.name
    this.lat = data.lat
    this.lng = data.lng
    this.availableLots = data.availableLots
  }

  get location(): [number, number] {
    return [this.lat, this.lng]
  }

}
