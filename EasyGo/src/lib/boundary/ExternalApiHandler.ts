import { RouteLeg } from "../entityclass/RouteLeg";

interface CarparkData {
    CarParkID: string;
    Area: string;
    Development: string;
    Location: string;
    AvailableLots: number;
    LotType: string;
    Agency: string;
}

interface StationData {
    Station: string;
    StartTime: string;
    EndTime: string;
    CrowdLevel: string;
}

interface Incident {
    type: string;
    latitude: number;
    longtitude: number;
    message: string;
}

export class ExternalApiHandler {
    private lta_access_token: string;

    private async getRainfall(route: RouteLeg) {

    }

    private async getHeatStressLevel(route: RouteLeg) {
        
    }

    public constructor() {
        this.lta_access_token = process.env.LTA_ACCESS_TOKEN ?? '';
    }

    public async getTrafficIncident(route: RouteLeg): Promise<Incident[]> {
        try {
            const url = 'https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents';
            if (!this.lta_access_token)
                throw new Error('No access token for LTA Datamall');
            const response = await fetch(
                url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'AccountKey': this.lta_access_token,
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

    public async fetchCarparkAvailability(latitude: number, longtitude: number): Promise<CarparkData[]> {
        const url = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
        if (!this.lta_access_token)
            throw new Error('No access token for LTA Datamall');
        const response = await fetch(
            url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'AccountKey': this.lta_access_token,
                }
            }
        );
        if (!response.ok) {
            throw new Error('Fail to fetch carpark availability API');
        }
        const data = await response.json();
        const carparks: CarparkData[] = data.value;
        return carparks;
    }

    public async fetchPlatformDensity(trainLine: string): Promise<StationData[]> {
        const baseUrl = 'https://datamall2.mytransport.sg/ltaodataservice/PCDRealTime';
        const params = new URLSearchParams({
            'TrainLine': trainLine,
        });
        const url = `${baseUrl}?${params.toString()}`;
        if (!this.lta_access_token) 
            throw new Error('No LTA access token!');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'AccountKey': this.lta_access_token,
            }
        });
        if (!response.ok)
            throw new Error('Fail to request for platform density');

        const data = await response.json();   
        const stationDataList: StationData[] = data.value;
        return stationDataList;      
    }  
}