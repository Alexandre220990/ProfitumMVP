export async function apiRequest(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  data?: any,
  headers: Record<string, string> = {},
  cache: boolean = false // ✅ Ajout d'un paramètre pour gérer le cache des requêtes GET
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // ✅ Timeout augmenté à 15 sec

  try {
    console.log(`[API] ${method} ${url}`, data || "Aucune donnée envoyée");

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: method !== "GET" && data ? JSON.stringify(data) : null,
      signal: controller.signal,
      credentials: "include", // ✅ Assure que les sessions fonctionnent
      cache: cache ? "force-cache" : "no-store", // ✅ Gestion du cache uniquement pour GET
    };

    const fetchPromise = fetch(url, fetchOptions);

    const response = await Promise.race([
      fetchPromise,
      new Promise<Response>((_, reject) =>
        setTimeout(() => {
          controller.abort();
          reject(new Error("Timeout de la requête après 15s"));
        }, 15000)
      ),
    ]);

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[API] Erreur ${response.status} sur ${url}`);
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `Erreur ${response.status}` };
      }
      return { success: false, status: response.status, data: errorData };
    }

    // ✅ Vérification si le body est JSON
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    const result = isJson ? await response.json() : null;

    console.log(`[API] Réponse OK (${response.status})`, result);
    return { success: true, status: response.status, data: result };
  } catch (error: any) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      console.error("[API] Timeout atteint, requête annulée");
      return { success: false, status: 408, data: { message: "Requête annulée (timeout)" } };
    }

    console.error("[API] Erreur:", error);
    return { success: false, status: 500, data: { message: error.message || "Erreur serveur" } };
  }
}

// ✅ Ajout du paramètre `cache` dans GET pour activer le caching des réponses
export const get = async (url: string, headers?: Record<string, string>, cache: boolean = false) => {
  return apiRequest(url, "GET", undefined, headers, cache);
};

export const post = async (url: string, data?: any, headers?: Record<string, string>) => {
  return apiRequest(url, "POST", data, headers);
};

export const put = async (url: string, data?: any, headers?: Record<string, string>) => {
  return apiRequest(url, "PUT", data, headers);
};

export const del = async (url: string, headers?: Record<string, string>) => {
  return apiRequest(url, "DELETE", undefined, headers);
};
