import type {
  CreateLinkRequest,
  CreateLinkResponse,
  Link,
  LinksResponse,
  StatsResponse
} from "../types/link";

const API_URL = "http://localhost:5000";

export async function createLink(
  data: CreateLinkRequest
): Promise<CreateLinkResponse> {
  const response = await fetch(
    `${API_URL}/api/links`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Failed to create link"
    );
  }

  return result;
}

export async function getLinks(
  search = "",
  page = 1,
  limit = 10
): Promise<LinksResponse> {
  const params = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit)
  });

  const response = await fetch(
    `${API_URL}/api/links?${params}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch links"
    );
  }

  return response.json();
}

export async function getLink(
  id: number
): Promise<Link> {
  const response = await fetch(
    `${API_URL}/api/links/${id}`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Failed to fetch link"
    );
  }

  return result;
}

export async function getStats(
  id: number
): Promise<StatsResponse> {
  const response = await fetch(
    `${API_URL}/api/links/${id}/stats`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch statistics"
    );
  }

  return response.json();
}

export async function disableLink(
  id: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/links/${id}/disable`,
    {
      method: "PATCH"
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Failed to disable link"
    );
  }
}

export async function deleteLink(
  id: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/links/${id}`,
    {
      method: "DELETE"
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Failed to delete link"
    );
  }
}