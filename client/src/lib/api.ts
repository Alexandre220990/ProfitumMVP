export async function apiRequest(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  data?: any,
  headers: Record<string, string> = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // Timeout de 10 secondes

  try {
    const fetchPromise = fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: method !== "GET" && data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    const response = await Promise.race([
      fetchPromise,
      new Promise<Response>((_, reject) =>
        setTimeout(() => {
          controller.abort();
          reject(new Error("Timeout de la requête"));
        }, 10000)
      ),
    ]);

    clearTimeout(timeout);

    // Vérification si la réponse contient du JSON
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const result = isJson ? await response.json() : null;

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        data: result || { message: `Erreur ${response.status}` },
      };
    }

    return { success: true, status: response.status, data: result };
  } catch (error: any) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      console.error("Requête annulée : timeout atteint.");
      return { success: false, status: 408, data: { message: "Requête annulée (timeout)" } };
    }

    console.error("Erreur API:", error);
    return { success: false, status: 500, data: { message: error.message || "Erreur serveur" } };
  }
}

// ✅ Ajouter une fonction post basée sur apiRequest
export const post = async (url: string, data?: any, headers?: Record<string, string>) => {
  return apiRequest(url, "POST", data, headers);
};

// ✅ Exporter également d'autres méthodes si nécessaire
export const get = async (url: string, headers?: Record<string, string>) => {
  return apiRequest(url, "GET", undefined, headers);
};

export const put = async (url: string, data?: any, headers?: Record<string, string>) => {
  return apiRequest(url, "PUT", data, headers);
};

export const del = async (url: string, headers?: Record<string, string>) => {
  return apiRequest(url, "DELETE", undefined, headers);
};
