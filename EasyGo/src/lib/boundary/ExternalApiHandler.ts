import { RouteLeg } from "../entityclass/RouteLeg";
import { calCrow } from "../utils";

interface CarparkData {
    CarParkID: string;
    Area: string;
    Development: string;
    Location: string;
    AvailableLots: number;
    LotType: string;
    Agency: string;
}

interface Incident {
    type: string;
    latitude: number;
    longtitude: number;
    message: string;
}

export class ExternalApiHandler {
    public async getTrafficIncident(route: RouteLeg): Promise<Incident[]> {
        try {
            const access_token = process.env.LTA_ACCESS_TOKEN;
            const url = 'https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents';
            if (!access_token)
                throw new Error('No access token for LTA Datamall');
            const response = await fetch(
                url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'AccountKey': access_token,
                    }
                }
            );
            if (response.ok) {
                throw new Error('Error fetch data');
            }
            const incidents = await response.json() as Incident[];
            return incidents;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getWeatherData(route: RouteLeg) {
        const url = 'https://api-open.data.gov.sg/v2/real-time/api/rainfall';
        const response = await fetch(url, {
            headers: {
                'X-Api-Key': 'YOUR_SECRET_TOKEN'
            }
        });
        const data = await response.json();
    }

    public async getNearestCarpark(latitude: number, longtitude: number) {
        try {
            const access_token = process.env.LTA_ACCESS_TOKEN;
            const url = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
            if (!access_token)
                throw new Error('No access token for LTA Datamall');
            const response = await fetch(
                url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'AccountKey': access_token,
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Fail to fetch carpark availability API');
            }
            const data = await response.json();
            const allCarParks: CarparkData[] = data.value;
            let minDistance = Infinity;
            allCarParks.forEach(carparkData => {
                const location = carparkData.Location;
                const [lat, long] = location.split(' ').map(parseFloat);
                const distance = calCrow(lat, long, latitude, longtitude);
                if (distance < minDistance)
                    minDistance = distance
            })

        } catch(e) {
            console.error(e);
        }
    }
}