import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveForecast,
  type CreateExecutiveForecastInput,
  type ExecutiveForecast,
} from "./ExecutiveForecast.js";

export class ExecutiveForecastService {

  private readonly forecasts =
    new Map<
      string,
      ExecutiveForecast
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveForecastInput,
  ): ExecutiveForecast {

    const forecast =
      createExecutiveForecast(
        input,
      );

    this.forecasts.set(
      forecast.id,
      forecast,
    );

    this.timeline.record({
      id:
        `${forecast.id}:created`,
      sessionId:
        forecast.sessionId,
      type:
        "runtime-event",
      actorId:
        forecast.ownerId,
      source:
        "executive-forecast",
      title:
        forecast.title,
      summary:
        forecast.horizon,
      payload: {
        forecastId:
          forecast.id,
        confidence:
          forecast.confidence,
      },
    });

    return forecast;
  }

  get(
    id: string,
  ) {
    return this.forecasts.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.forecasts.values(),
      ),
    );
  }

  clear(): void {
    this.forecasts.clear();
  }
}

export function
createExecutiveForecastService() {
  return new ExecutiveForecastService();
}
