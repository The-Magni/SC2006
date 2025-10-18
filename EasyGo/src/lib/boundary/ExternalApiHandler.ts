import { RouteLeg } from "../entityclass/RouteLeg";

export interface CarparkData {
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
    longitude: number;
    message: string;
}

interface AreaMetadata {
    name: string;
    label_location: {
        latitude: number;
        longitude: number
    }
}

interface WeatherData {
    area: string;
    forecast: string;
}

export class ExternalApiHandler {
    private lta_access_token: string;

    public constructor() {
        this.lta_access_token = process.env.LTA_ACCESS_TOKEN ?? '';
    }

    public async fetchTrafficIncident(): Promise<Incident[]> {
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
    }

    public async fetchWeatherData(): Promise<[AreaMetadata[], WeatherData[]]> {
        const url = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast';
        const response = await fetch(url, {
            headers: {
                'X-Api-Key': 'YOUR_SECRET_TOKEN'
            }
        });
        const data = await response.json();
        const metadata: AreaMetadata[] = data.data.area_metadata;
        const forecast: WeatherData[] = data.items.forecasts;
        return [metadata, forecast];
    }

    public async fetchCarparkAvailability(): Promise<CarparkData[]> {
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