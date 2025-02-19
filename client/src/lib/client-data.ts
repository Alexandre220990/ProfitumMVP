import { get } from "@/lib/api";

export const getClientData = async () => {
  try {
    console.log("📡 Récupération des données client...");
    const response: any = await get("/api/client-data");

    if (!response.success) {
      throw new Error(response.data?.message || "Erreur lors de la récupération des données.");
    }

    return response;
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des données client:", error);
    return { success: false, data: null };
  }
};
