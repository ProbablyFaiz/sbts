import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";

interface PublishRequest {
  request_id: string;
  template_name: string;
  ballot_fields: Record<string, any>;
}

interface PublishResponse {
  request_id: string;
  bucket_url: string;
}

export const handler: HttpFunction = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const publisherUrl = `${process.env.FANOUT_PUBLISHER_ENDPOINT}/publish`;
  const requests: PublishRequest[] = req.body;

  try {
    const responses = await Promise.all(
      requests.map((request) =>
        fetch(publisherUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }).then((r) => r.json()),
      ),
    );
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: "Failed to process publish requests" });
  }
};
