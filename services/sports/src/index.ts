import { SportsEvent } from "@vladfsbet/types";

export interface SportsFeedProviderInterface {
  slug: string;
  name: string;
  getEvents(sport?: string): Promise<SportsEvent[]>;
  getEventById(eventId: string): Promise<SportsEvent | null>;
}

export class MockSportsFeedProvider implements SportsFeedProviderInterface {
  slug = "sandbox-sports-feed";
  name = "Sandbox Sports Feed Provider";

  async getEvents(sport?: string): Promise<SportsEvent[]> {
    return [
      {
        id: "evt_1",
        sport: "Soccer",
        name: "Manchester City vs Real Madrid",
        startsAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        status: "UPCOMING",
        markets: [
          {
            id: "mkt_1",
            eventId: "evt_1",
            name: "1X2 Full Time",
            status: "OPEN",
            selections: [
              { id: "1", name: "Manchester City", odds: 2.10 },
              { id: "X", name: "Draw", odds: 3.60 },
              { id: "2", name: "Real Madrid", odds: 3.25 },
            ],
          },
        ],
      },
      {
        id: "evt_2",
        sport: "Basketball",
        name: "Boston Celtics vs Golden State Warriors",
        startsAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        status: "UPCOMING",
        markets: [
          {
            id: "mkt_2",
            eventId: "evt_2",
            name: "Moneyline",
            status: "OPEN",
            selections: [
              { id: "bos", name: "Boston Celtics", odds: 1.65 },
              { id: "gsw", name: "Golden State Warriors", odds: 2.30 },
            ],
          },
        ],
      },
    ];
  }

  async getEventById(eventId: string): Promise<SportsEvent | null> {
    const events = await this.getEvents();
    return events.find((e) => e.id === eventId) || null;
  }
}
