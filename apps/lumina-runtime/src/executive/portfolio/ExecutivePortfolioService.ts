import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutivePortfolio,
  type CreateExecutivePortfolioInput,
  type ExecutivePortfolio,
  type ExecutivePortfolioStatus,
} from "./ExecutivePortfolio.js";

export class ExecutivePortfolioService {

  private readonly portfolios =
    new Map<
      string,
      ExecutivePortfolio
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutivePortfolioInput,
  ): ExecutivePortfolio {

    const portfolio =
      createExecutivePortfolio(
        input,
      );

    this.portfolios.set(
      portfolio.id,
      portfolio,
    );

    this.timeline.record({
      id:
        `${portfolio.id}:created`,
      sessionId:
        portfolio.sessionId,
      type:
        "runtime-event",
      actorId:
        portfolio.ownerId,
      source:
        "executive-portfolio",
      title:
        portfolio.name,
      summary:
        portfolio.description,
      payload: {
        portfolioId:
          portfolio.id,
        budget:
          portfolio.budget,
        initiatives:
          portfolio.initiatives.length,
      },
    });

    return portfolio;
  }

  updateStatus(
    portfolioId: string,
    status:
      ExecutivePortfolioStatus,
  ): ExecutivePortfolio {

    const existing =
      this.portfolios.get(
        portfolioId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive portfolio "${portfolioId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.portfolios.set(
      portfolioId,
      updated,
    );

    this.timeline.record({
      id:
        `${portfolioId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-portfolio",
      title:
        updated.name,
      summary:
        `Portfolio status changed to ${status}.`,
      payload: {
        portfolioId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.portfolios.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.portfolios.values(),
      ),
    );
  }

  clear(): void {
    this.portfolios.clear();
  }
}

export function
createExecutivePortfolioService() {
  return new ExecutivePortfolioService();
}
