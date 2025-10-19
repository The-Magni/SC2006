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

export interface Incident {
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

interface BusData {
    OriginCode: string;
    DestinationCode: string;
    EstimatedArrival: string;
    Monitored: number;
    Latitude: string;
    Longitude: string;
    VisitNumber: string;
    Load: string;
    Feature: string;
    Type: string;
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
        console.log(trainLine);
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
                'Content-Type': 'application/json',
                'AccountKey': this.lta_access_token,
            }
        });
        if (!response.ok) {
            console.log(response);
            throw new Error('Fail to request for platform density');
        }
        const data = await response.json();   
        const stationDataList: StationData[] = data.value;
        return stationDataList;      
    }  

    public async fetchBusArrivalTime(busStopCode: string, serviceNo: string) {
        const baseUrl = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';
        const params = new URLSearchParams({
            'BusStopCode': busStopCode,
            'ServiceNo': serviceNo
        });
        const url = `${baseUrl}?${params.toString()}`;
        if (!this.lta_access_token) 
            throw new Error('No LTA access token!');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'AccountKey': this.lta_access_token,
            }
        });
        if (!response.ok)
            throw new Error('Fail to fetch bus arrival time');
        const data = await response.json();
        const firstBus: BusData = data.Services[0].NextBus;
        const secondBus: BusData = data.Services[0].NextBus2;
        const thirdBus: BusData = data.Services[0].NextBus3;
        if (!firstBus)
            return []
        else if (!secondBus)
            return [firstBus];
        else if (!thirdBus)
            return [firstBus, secondBus];
        else
            return [firstBus, secondBus, thirdBus];
    }
}