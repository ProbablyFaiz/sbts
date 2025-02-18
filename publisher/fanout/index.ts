import {
  HttpFunction,
  Request,
} from "@google-cloud/functions-framework/build/src/functions";

const PUBLISHER_ENDPOINT = process.env.FANOUT_PUBLISHER_ENDPOINT;
const API_KEY = process.env.FANOUT_API_KEY;

interface PublishRequest {
  request_id: string;
  template_name: string;
  ballot_fields: Record<string, any>;
}

interface PublishResponse {
  request_id: string;
  bucket_url: string;
}

const validAuth = (req: Request) => {
  const authHeader = req.headers["authorization"];
  return authHeader === `Bearer ${API_KEY}`;
};

async function publishWithRetry(
  request: PublishRequest,
  publisherUrl: string,
): Promise<PublishResponse> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(publisherUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(
        `Attempt ${attempt} failed for request ${request.request_id}, retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Unreachable");
}

export const handler: HttpFunction = async (req, res) => {
  if (!process.env.FANOUT_API_KEY) {
    throw new Error("FANOUT_API_KEY is not set");
  }
  if (!process.env.FANOUT_PUBLISHER_ENDPOINT) {
    throw new Error("FANOUT_PUBLISHER_ENDPOINT is not set");
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!validAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const publisherUrl = `${PUBLISHER_ENDPOINT}/publish`;
  const requests: PublishRequest[] = req.body;

  try {
    const responses = await Promise.all(
      requests.map((request) => publishWithRetry(request, publisherUrl)),
    );
    res.json(responses.filter((r) => r !== null));
  } catch (error) {
    console.error("Error processing publish requests:", error);
    res.status(500).json({ error: "Failed to process publish requests" });
  }
};
