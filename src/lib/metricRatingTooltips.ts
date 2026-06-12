import type { MetricKey } from "@stock-analyzer/shared";

export type MetricRatingTooltipTier = {
  label: string;
  range: string;
  description: string;
};

export type MetricRatingTooltip = {
  title: string;
  note?: string;
  tiers: MetricRatingTooltipTier[];
};

export const METRIC_RATING_TOOLTIPS: Partial<
  Record<MetricKey, MetricRatingTooltip>
> = {
  pe: {
    title: "Price-to-Earnings (P/E) Ratio",
    tiers: [
      {
        label: "Good",
        range: "10 to 15",
        description:
          "Indicates the stock is reasonably valued or a bargain, assuming the business is stable.",
      },
      {
        label: "Ok",
        range: "16 to 25",
        description:
          "Standard market average; typical for steady, mature companies.",
      },
      {
        label: "Bad",
        range: "Above 25 or negative",
        description:
          "Expensive, requiring high future growth to justify, or the company is losing money.",
      },
    ],
  },
  cashFlowYield: {
    title: "Free Cash Flow (FCF) Yield",
    tiers: [
      {
        label: "Good",
        range: "Above 7%",
        description:
          "The company generates abundant cash relative to its stock price; highly attractive.",
      },
      {
        label: "Ok",
        range: "4% to 6%",
        description:
          "Average; cash generation matches standard market returns.",
      },
      {
        label: "Bad",
        range: "Below 3% or negative",
        description:
          "Very expensive cash valuation, or the company is actively burning cash.",
      },
    ],
  },
  priceToBook: {
    title: "Price-to-Book (P/B) Ratio",
    tiers: [
      {
        label: "Good",
        range: "Under 1.0",
        description:
          "The stock trades for less than the accounting value of its net assets.",
      },
      {
        label: "Ok",
        range: "1.0 to 3.0",
        description:
          "Standard valuation for healthy, asset-efficient companies.",
      },
      {
        label: "Bad",
        range: "Above 4.0 or negative",
        description:
          "The market is paying a massive premium over physical assets, or equity is negative.",
      },
    ],
  },
  grahamNcav: {
    title: "Graham Net-Net Asset Value (Per Share vs. Stock Price)",
    tiers: [
      {
        label: "Good",
        range: "Stock price is below the Net-Net value",
        description:
          "You are essentially getting the factories, equipment, and future earnings completely free.",
      },
      {
        label: "Ok",
        range: "Stock price is equal to or up to 1.5× the Net-Net value",
        description:
          "A solid margin of safety based purely on liquid assets.",
      },
      {
        label: "Bad",
        range: "Stock price is significantly higher than Net-Net value",
        description:
          'Normal for most stocks, but "bad" if your specific strategy relies strictly on liquidation value safety.',
      },
    ],
  },
  roe: {
    title: "Return on Equity (ROE)",
    tiers: [
      {
        label: "Good",
        range: "Above 15%",
        description:
          "Management is highly efficient at generating profit from shareholders' capital.",
      },
      {
        label: "Ok",
        range: "10% to 14%",
        description:
          "Acceptable; tracks close to historical corporate averages.",
      },
      {
        label: "Bad",
        range: "Below 10% or negative",
        description:
          "Inefficient use of equity, or the company is unprofitable.",
      },
    ],
  },
  roic: {
    title: "Return on Invested Capital (ROIC)",
    tiers: [
      {
        label: "Good",
        range: "Above 12%",
        description:
          "The business generates excellent returns on both the debt and equity capital put to work.",
      },
      {
        label: "Ok",
        range: "8% to 11%",
        description:
          "Decent; generally covers the company's baseline cost of capital.",
      },
      {
        label: "Bad",
        range: "Below 7%",
        description:
          "The company is likely destroying value, as it earns less on its capital than it costs to borrow it.",
      },
    ],
  },
  debtToAssets: {
    title: "Debt-to-Asset Ratio",
    tiers: [
      {
        label: "Good",
        range: "Below 0.50 (50%)",
        description:
          "More than half of the company's assets are financed via equity; low financial risk.",
      },
      {
        label: "Ok",
        range: "0.50 to 0.70 (50%–70%)",
        description: "Moderate, healthy mix of debt and equity financing.",
      },
      {
        label: "Bad",
        range: "Above 0.70 (70%)",
        description:
          "The company is highly leveraged, relying heavily on debt to sustain its assets.",
      },
    ],
  },
  sharpe: {
    title: "Sharpe Ratio (Investment Risk/Reward)",
    note: "Unlike the fundamental metrics above, the Sharpe Ratio measures historical stock price volatility relative to returns.",
    tiers: [
      {
        label: "Good",
        range: "1.0 to 1.99",
        description:
          "The stock offers strong returns relative to the amount of price volatility you have to stomach. Above 2.0 is considered excellent.",
      },
      {
        label: "Ok",
        range: "0.5 to 0.99",
        description:
          "Acceptable; the returns justify the volatility risk, but it will be a bumpy ride.",
      },
      {
        label: "Bad",
        range: "Below 0.5 or negative",
        description:
          "The historical return does not justify the high volatility, or the asset lost money.",
      },
    ],
  },
  dividendYieldGrowthYoY: {
    title: "Dividend Yield Growth (YoY)",
    tiers: [
      {
        label: "Good",
        range: "5% to 12% per year",
        description:
          "A healthy, mature company growing its payout inline with or slightly faster than inflation and earnings.",
      },
      {
        label: "Ok",
        range: "13% to 20% per year",
        description:
          "Acceptable for a younger, fast-growing company, or a cyclical business coming out of a down year.",
      },
      {
        label: "Bad",
        range: "Above 25% per year or negative",
        description: "Unsustainably fast payout growth, or a declining dividend.",
      },
    ],
  },
};

export function getMetricRatingTooltip(
  key: MetricKey
): MetricRatingTooltip | undefined {
  return METRIC_RATING_TOOLTIPS[key];
}
