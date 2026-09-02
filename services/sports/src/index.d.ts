import { SportsEvent } from "@vladfsbet/types";
export interface SportsFeedProviderInterface {
    slug: string;
    name: string;
    getEvents(sport?: string): Promise<SportsEvent[]>;
    getEventById(eventId: string): Promise<SportsEvent | null>;
}
export declare class MockSportsFeedProvider implements SportsFeedProviderInterface {
    slug: string;
    name: string;
    getEvents(sport?: string): Promise<SportsEvent[]>;
    getEventById(eventId: string): Promise<SportsEvent | null>;
}
