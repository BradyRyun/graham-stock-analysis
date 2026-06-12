import { z } from "zod";

export const BusinessProfileData = z.object({
  businessDescription: z.string(),
  businessModels: z.array(z.string()).min(1),
  sector: z.string(),
  coreThreats: z.array(z.string()).min(1),
});
export type BusinessProfileData = z.infer<typeof BusinessProfileData>;

export const BusinessProfileResponse = z.object({
  symbol: z.string(),
  companyName: z.string().nullable(),
  generatedAt: z.string(),
  cached: z.boolean(),
  profile: BusinessProfileData,
});
export type BusinessProfileResponse = z.infer<typeof BusinessProfileResponse>;
