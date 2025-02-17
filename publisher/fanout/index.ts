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
      requests.map((request) =>
        fetch(publisherUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(request),
        }).then((r) => {
          try {
            return r.json();
          } catch (error) {
            console.error("Error parsing response:", error);
            console.log("Response:", r);
            throw error;
          }
        }),
      ),
    );
    res.json(responses);
  } catch (error) {
    console.error("Error processing publish requests:", error);
    res.status(500).json({ error: "Failed to process publish requests" });
  }
};
