import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL:
    "https://go.apis.huit.harvard.edu/ais-openai-direct-limited-schools/v1/",
});
