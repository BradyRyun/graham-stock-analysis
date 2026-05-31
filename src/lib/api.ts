import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { z, ZodType } from "zod";

export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_BACKEND_URL ?? "";
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 90_000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  public async get<Schema extends ZodType>(
    url: string,
    schema: Schema,
    config?: AxiosRequestConfig
  ): Promise<z.infer<Schema>> {
    try {
      const response = await this.axiosInstance.get(url, config);
      return this.parseResult(response, schema);
    } catch (e) {
      this.httpErrorHandler(e);
    }
  }

  private parseResult<Schema extends ZodType>(
    response: AxiosResponse,
    schema: Schema
  ): z.infer<Schema> {
    const data = response.data;
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error(result.error);
      throw new Error("Failed to validate response data");
    }
    return result.data;
  }

  private httpErrorHandler(error: unknown | AxiosResponse): never {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (message === "" || message === null || message === undefined) {
        throw new Error("Something went wrong. Please try again later.");
      }
      throw new Error(message);
    }
    throw new Error(
      "Unknown error occurred while communicating with the server."
    );
  }
}

export const api = new ApiService();
