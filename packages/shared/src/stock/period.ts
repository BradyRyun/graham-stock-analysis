import { z } from "zod";

export const MetricsPeriod = z.enum(["1y", "3y"]);
export type MetricsPeriod = z.infer<typeof MetricsPeriod>;
