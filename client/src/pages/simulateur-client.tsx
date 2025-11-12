import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Edit3, CheckCircle2, Save, AlertCircle, ArrowLeft } from "lucide-react";
import { config } from "@/config/env";
import { useAuth } from "@/hooks/use-auth";

interface QuestionOptions {
  choix?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  unite?: string;
  step?: number;
}

interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

interface QuestionConditions {
  depends_on?: string;
  value?: any;
  operator?: "equals" | "not_equals" | "greater_than" | "less_than";
}

interface Question {
  id: string;
  question_id?: string;
  question_order: number;
  question_text: string;
  question_type: "choix_unique" | "choix_multiple" | "nombre" | "texte" | "composite_energy";
  description?: string;
  options: QuestionOptions;
  validation_rules: ValidationRules;
  importance: number;
  conditions: QuestionConditions;
  produits_cibles: string[];
  phase?: number;
  placeholder?: string | null;
  section?: string | null;
}

type EnergyVariantKey = "electricite" | "gaz";

interface EnergyVariantAnswer {
  hasInvoices: boolean;
  monthlyAmount: number | null;
}

interface EnergyCompositeAnswer {
  electricite: EnergyVariantAnswer;
  gaz: EnergyVariantAnswer;
}

const ENERGY_VARIANTS: Array<{
  key: EnergyVariantKey;
  title: string;
  helper: string;
  placeholder: string;
}> = [
  {
    key: "electricite",
    title: "Factures d'électricité",
    helper: "Montant moyen payé chaque mois pour l'électricité.",
    placeholder: "Ex: 1200"
  },
  {
    key: "gaz",
    title: "Factures de gaz",
    helper: "Montant moyen payé chaque mois pour le gaz naturel.",
    placeholder: "Ex: 800"
  }
];

const DEFAULT_ENERGY_ANSWER: EnergyCompositeAnswer = {
  electricite: { hasInvoices: false, monthlyAmount: null },
  gaz: { hasInvoices: false, monthlyAmount: null }
};

const parseNumericValue = (input: any): number | null => {
  if (input === undefined || input === null || input === "") {
    return null;
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  if (typeof input === "string") {
    const sanitized = input.replace(/€/g, "").replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(sanitized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const toBoolean = (input: any): boolean => {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "number") {
    return input > 0;
  }
  if (typeof input === "string") {
    const normalized = input.trim().toLowerCase();
    return ["oui", "true", "1", "yes", "y"].includes(normalized);
  }
  return false;
};

const normalizeEnergyCompositeAnswer = (raw: any): EnergyCompositeAnswer => {
  if (!raw || typeof raw !== "object") {
    return {
      electricite: { ...DEFAULT_ENERGY_ANSWER.electricite },
      gaz: { ...DEFAULT_ENERGY_ANSWER.gaz }
    };
  }

  const result: EnergyCompositeAnswer = {
    electricite: { ...DEFAULT_ENERGY_ANSWER.electricite },
    gaz: { ...DEFAULT_ENERGY_ANSWER.gaz }
  };

  (["electricite", "gaz"] as EnergyVariantKey[]).forEach((variant) => {
    const segment =
      raw[variant] ||
      raw[variant.toUpperCase()] || {
        hasInvoices:
          raw[`${variant}HasInvoices`] ??
          raw[`${variant}_hasInvoices`] ??
          raw[`${variant}Active`] ??
          raw[`${variant}_active`],
        monthlyAmount:
          raw[`${variant}Monthly`] ??
          raw[`${variant}_monthly`] ??
          raw[`${variant}Montant`] ??
          raw[`${variant}_montant`] ??
          raw[`${variant}Amount`] ??
          raw[`${variant}_amount`]
      };

    const hasInvoices =
      toBoolean(segment?.hasInvoices) ||
      toBoolean(segment?.has_factures) ||
      toBoolean(segment?.hasContracts) ||
      toBoolean(segment?.active) ||
      toBoolean(segment?.oui);

    const monthlyAmount =
      parseNumericValue(segment?.monthlyAmount) ??
      parseNumericValue(segment?.montant) ??
      parseNumericValue(segment?.amount) ??
      parseNumericValue(segment?.value);

    result[variant] = {
      hasInvoices: hasInvoices || (!!monthlyAmount && monthlyAmount > 0),
      monthlyAmount: monthlyAmount && monthlyAmount > 0 ? monthlyAmount : null
    };
  });

  return result;
};

const sortQuestionsDeterministically = (questionsList: Question[]): Question[] => {
  return [...questionsList].sort((a, b) => {
    const sectionA = (a.section ?? "").toLowerCase();
    const sectionB = (b.section ?? "").toLowerCase();
    if (sectionA !== sectionB) {
      return sectionA.localeCompare(sectionB);
    }

    const phaseA = a.phase ?? 0;
    const phaseB = b.phase ?? 0;
    if (phaseA !== phaseB) {
      return phaseA - phaseB;
    }

    const orderA = a.question_order ?? 0;
    const orderB = b.question_order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const idA = a.question_id ?? a.id;
    const idB = b.question_id ?? b.id;
    return idA.localeCompare(idB);
  });
};

interface SimulatorSessionResponse {
  success: boolean;
  simulation_id: string | null;
  answers: Record<string, any>;
  last_completed_simulation: any;
  message?: string;
  expires_at?: string | null;
}

const SimulateurClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [completedSimulation, setCompletedSimulation] = useState<any | null>(null);
  const [draftSimulation, setDraftSimulation] = useState<{
    id: string;
    answers: Record<string, any>;
    expires_at?: string | null;
  } | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finalizing, setFinalizing] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);

  const pendingChangesRef = useRef<Record<string, any>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const phaseDefinitions = useMemo(() => {
    const phases = new Map<number, { phase: number; questions: Question[] }>();
    questions.forEach((question) => {
      const phaseNumber = question.phase ?? 0;
      if (!phases.has(phaseNumber)) {
        phases.set(phaseNumber, { phase: phaseNumber, questions: [] });
      }
      phases.get(phaseNumber)!.questions.push(question);
    });

    return Array.from(phases.values()).sort((a, b) => a.phase - b.phase);
  }, [questions]);

  useEffect(() => {
    if (!user) {
      toast.error("Vous devez être connecté pour accéder au simulateur client");
      navigate("/connexion-client");
    }
  }, [user, navigate]);

  const getHeadersWithAuth = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };

    const token =
      localStorage.getItem("token") || localStorage.getItem("supabase_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/simulator/questions`);
      if (response.ok) {
        const questionsData = await response.json();
        const questionsList: Question[] = questionsData.questions || questionsData;
        const sortedQuestions = sortQuestionsDeterministically(Array.isArray(questionsList) ? questionsList : []);
        setQuestions(sortedQuestions);
      } else {
        console.error("❌ Erreur chargement questions simulateur");
        toast.error("Impossible de charger les questions du simulateur");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des questions: ", error);
      toast.error("Erreur lors du chargement des questions");
    }
  }, []);

  const shouldDisplayQuestion = useCallback(
    (question: Question, answersSource: Record<string, any>) => {
      const condition = question.conditions;
      if (!condition || !condition.depends_on) {
        return true;
      }

      const dependentValue = answersSource[condition.depends_on];
      if (dependentValue === undefined || dependentValue === null) {
        return false;
      }

      switch (condition.operator) {
        case "not_equals":
          return dependentValue !== condition.value;
        case "greater_than":
          return Number(dependentValue) > Number(condition.value);
        case "less_than":
          return Number(dependentValue) < Number(condition.value);
        case "equals":
        default:
          return dependentValue === condition.value;
      }
    },
    []
  );

  const fetchSession = useCallback(
    async (options: { autoCreateDraft?: boolean } = {}) => {
      if (!user) {
        return null;
      }

      setSessionLoading(true);
      try {
        const response = await fetch(`${config.API_URL}/api/simulator/session`, {
          method: "POST",
          credentials: "include",
          headers: getHeadersWithAuth(),
          body: JSON.stringify({
            client_data: {
              client_mode: true,
              created_at: new Date().toISOString(),
              auto_create_draft: options.autoCreateDraft === true
            }
          })
        });

        if (!response.ok) {
          throw new Error("Réponse invalide de l'API session");
        }

        const data: SimulatorSessionResponse = await response.json();

        if (!data.success) {
          toast.error(
            data.message ||
              "Impossible de récupérer les informations de votre simulation"
          );
          return data;
        }

        setCompletedSimulation(data.last_completed_simulation || null);

        if (data.simulation_id) {
          const answers = data.answers || {};
          setDraftSimulation({
            id: data.simulation_id,
            answers,
            expires_at: data.expires_at ?? null
          });

          if (options.autoCreateDraft || !isEditing) {
            setDraftAnswers(answers);
          }

          if (options.autoCreateDraft) {
            setIsEditing(true);
            setMissingQuestions([]);
            toast.success("Brouillon de simulation prêt à être modifié");
          }
        } else {
          setDraftSimulation(null);
          if (!options.autoCreateDraft) {
            setIsEditing(false);
          }
        }

        pendingChangesRef.current = {};
        setSaveStatus("idle");
        return data;
      } catch (error) {
        console.error("Erreur session simulateur:", error);
        toast.error("Impossible de récupérer votre simulation");
        return null;
      } finally {
        setSessionLoading(false);
        setLoading(false);
      }
    },
    [getHeadersWithAuth, isEditing, user]
  );

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (user) {
      fetchSession({ autoCreateDraft: false });
    }
  }, [user, fetchSession]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const persistDraft = useCallback(async () => {
    if (!draftSimulation) {
      return false;
    }

    const changes = pendingChangesRef.current;
    if (!changes || Object.keys(changes).length === 0) {
      return true;
    }

    setSaveStatus("saving");

    try {
      const response = await fetch(
        `${config.API_URL}/api/client/simulation/draft/${draftSimulation.id}/answers`,
        {
          method: "PATCH",
          credentials: "include",
          headers: getHeadersWithAuth(),
          body: JSON.stringify({ responses: changes })
        }
      );

      if (!response.ok) {
        throw new Error("Erreur sauvegarde brouillon");
      }

      const payload = await response.json();
      const updated = payload?.data?.simulation;
      setDraftSimulation((prev) =>
        prev
          ? {
              ...prev,
              answers: updated?.answers || prev.answers,
              expires_at: updated?.expires_at ?? prev.expires_at
            }
          : prev
      );

      pendingChangesRef.current = {};
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
      return true;
    } catch (error) {
      console.error("Erreur de sauvegarde brouillon:", error);
      setSaveStatus("error");
      return false;
    }
  }, [draftSimulation, getHeadersWithAuth]);

  const handleAnswerChange = useCallback(
    (questionId: string, value: any) => {
      setDraftAnswers((prev) => ({
        ...prev,
        [questionId]: value
      }));

      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        [questionId]: value
      };

      setSaveStatus("saving");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        persistDraft();
      }, 600);
    },
    [persistDraft]
  );

  const handleStartEditing = useCallback(async () => {
    const session = await fetchSession({ autoCreateDraft: true });
    if (session?.simulation_id) {
      setIsEditing(true);
    }
  }, [fetchSession]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
    pendingChangesRef.current = {};
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const handleFinalize = useCallback(async () => {
    if (!draftSimulation) {
      toast.error("Aucun brouillon à valider");
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    await persistDraft();

    setFinalizing(true);
    setMissingQuestions([]);

    try {
      const response = await fetch(`${config.API_URL}/api/client/simulation/update`, {
        method: "POST",
        credentials: "include",
        headers: getHeadersWithAuth(),
        body: JSON.stringify({
          simulationId: draftSimulation.id,
          responses: draftAnswers,
          simulationType: "update"
        })
      });

      if (response.status === 422) {
        const data = await response.json();
        setMissingQuestions(data?.missing_questions || []);
        toast.error("Merci de compléter les questions manquantes");
        return;
      }

      if (!response.ok) {
        throw new Error("Erreur finalisation simulation");
      }

      const payload = await response.json();

      toast.success(
        "Les nouveaux paramètres sont bien pris en compte. Montants mis à jour !"
      );

      pendingChangesRef.current = {};
      setSaveStatus("idle");
      setDraftSimulation(null);
      setIsEditing(false);
      setDraftAnswers({});

      if (payload?.data?.results) {
        setCompletedSimulation((prev: any) => ({
          ...(prev || {}),
          id: payload.data?.simulationId,
          answers: payload.data?.answers || draftAnswers,
          results: payload.data?.results
        }));
      }

      await fetchSession({ autoCreateDraft: false });
    } catch (error) {
      console.error("Erreur validation simulation:", error);
      toast.error("Impossible de finaliser la simulation");
    } finally {
      setFinalizing(false);
    }
  }, [draftAnswers, draftSimulation, fetchSession, getHeadersWithAuth, persistDraft]);

  const formatAnswer = useCallback(
    (question: Question, value: any) => {
      const questionCode = question.question_id || question.id;

      if (questionCode === "GENERAL_002") {
        const numericValue =
          typeof value === "number" ? value : parseNumericValue(value);
        if (numericValue === null) {
          return "Non renseigné";
        }
        return `${numericValue.toLocaleString("fr-FR")} €`;
      }

      if (questionCode === "GENERAL_003") {
        const numericValue =
          typeof value === "number" ? value : parseNumericValue(value);
        if (numericValue === null) {
          return "Non renseigné";
        }
        const suffix = numericValue > 1 ? "employés" : "employé";
        return `${numericValue} ${suffix}`;
      }

      if (questionCode === "CALCUL_ENERGIE_FACTURES") {
        const energyValue = normalizeEnergyCompositeAnswer(value);
        const hasAnyEnergy =
          energyValue.electricite.hasInvoices || energyValue.gaz.hasInvoices;

        if (!hasAnyEnergy) {
          return "Non renseigné";
        }

        const parts = ENERGY_VARIANTS.map(({ key, title }) => {
          const variantValue = energyValue[key];
          if (!variantValue.hasInvoices || !variantValue.monthlyAmount) {
            return `${title}: non concerné`;
          }
          return `${title}: ${variantValue.monthlyAmount.toLocaleString(
            "fr-FR"
          )} €/mois`;
        });
        return parts.join(" • ");
      }

      if (value === undefined || value === null) {
        return "Non renseigné";
      }

      if (Array.isArray(value)) {
        return value.length ? value.join(", ") : "Non renseigné";
      }

      if (typeof value === "number") {
        if (question.options?.unite) {
          return `${value} ${question.options.unite}`;
        }
        return value.toString();
      }

      if (typeof value === "boolean") {
        return value ? "Oui" : "Non";
      }

      return String(value);
    },
    []
  );

  const renderAnswerSummary = useCallback(
    (answers: Record<string, any>) => {
      if (!answers || Object.keys(answers).length === 0) {
        return (
          <p className="text-sm text-muted-foreground">
            Aucune réponse enregistrée pour le moment.
          </p>
        );
      }

      const orderedQuestions = [...questions]
        .filter((question) => answers[question.id] !== undefined)
        .sort((a, b) => (a.question_order || 0) - (b.question_order || 0));

      if (orderedQuestions.length === 0) {
        return (
          <p className="text-sm text-muted-foreground">
            Aucune réponse enregistrée pour le moment.
          </p>
        );
      }

      return (
        <div className="space-y-2 text-sm">
          {orderedQuestions.map((question) => (
            <div key={question.id} className="flex flex-col gap-1">
              <span className="font-medium text-slate-800">
                {question.question_text}
              </span>
              <span className="text-slate-600">
                → {formatAnswer(question, answers[question.id])}
              </span>
            </div>
          ))}
        </div>
      );
    },
    [formatAnswer, questions]
  );

  const renderQuestionInput = useCallback(
    (question: Question) => {
      const value = draftAnswers[question.id];
      const isMissing = missingQuestions.includes(question.id);

      if (!shouldDisplayQuestion(question, draftAnswers)) {
        return null;
      }

      const questionCode = question.question_id || question.id;

      if (questionCode === "GENERAL_002") {
        const numericValue =
          typeof value === "number" ? value : parseNumericValue(value);
        const displayValue = numericValue ?? "";

        return (
          <div className="space-y-1">
            <Input
              type="number"
              min={question.options?.min ?? 0}
              step={question.options?.step ?? 1000}
              value={displayValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === "") {
                  handleAnswerChange(question.id, null);
                  return;
                }
                const parsed = parseNumericValue(nextValue);
                handleAnswerChange(question.id, parsed ?? null);
              }}
              placeholder={
                question.placeholder ||
                question.options?.placeholder ||
                "Saisissez votre chiffre d'affaires en €"
              }
              className={
                isMissing ? "border-red-400 focus-visible:ring-red-400" : ""
              }
            />
            <p className="text-xs text-slate-500">
              Indiquez le montant exact de votre chiffre d'affaires annuel.
            </p>
          </div>
        );
      }

      if (questionCode === "GENERAL_003") {
        const numericValue =
          typeof value === "number" ? value : parseNumericValue(value);
        const displayValue = numericValue ?? "";

        return (
          <div className="space-y-1">
            <Input
              type="number"
              min={question.options?.min ?? 0}
              step={question.options?.step ?? 1}
              value={displayValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === "") {
                  handleAnswerChange(question.id, null);
                  return;
                }
                const parsed = parseNumericValue(nextValue);
                handleAnswerChange(question.id, parsed ?? null);
              }}
              placeholder={
                question.placeholder ||
                question.options?.placeholder ||
                "Nombre exact d'employés"
              }
              className={
                isMissing ? "border-red-400 focus-visible:ring-red-400" : ""
              }
            />
            <p className="text-xs text-slate-500">
              Comptez tous les salariés équivalents temps plein.
            </p>
          </div>
        );
      }

      if (questionCode === "CALCUL_ENERGIE_FACTURES") {
        const energyValue = normalizeEnergyCompositeAnswer(value);

        return (
          <div
            className={`space-y-4 rounded-lg border px-4 py-4 ${
              isMissing ? "border-red-300" : "border-slate-200"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                Factures d'énergie
              </p>
              <p className="text-xs text-slate-500">
                Sélectionnez les énergies concernées et indiquez le montant
                mensuel moyen de vos factures.
              </p>
            </div>
            {ENERGY_VARIANTS.map((variant) => {
              const variantValue = energyValue[variant.key];
              const showVariantError =
                isMissing &&
                variantValue.hasInvoices &&
                !variantValue.monthlyAmount;

              return (
                <div
                  key={variant.key}
                  className="space-y-3 rounded-md border border-slate-200 p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-800">
                        {variant.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {variant.helper}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Facture ?</span>
                      <Switch
                        checked={variantValue.hasInvoices}
                        onCheckedChange={(checked) => {
                          const nextValue = {
                            ...energyValue,
                            [variant.key]: {
                              hasInvoices: checked,
                              monthlyAmount: checked
                                ? variantValue.monthlyAmount
                                : null
                            }
                          } as EnergyCompositeAnswer;
                          handleAnswerChange(question.id, nextValue);
                        }}
                      />
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={question.options?.step ?? 50}
                    value={variantValue.monthlyAmount ?? ""}
                    disabled={!variantValue.hasInvoices}
                    placeholder={variant.placeholder}
                    className={`${variantValue.hasInvoices ? "" : "cursor-not-allowed opacity-60"} ${
                      showVariantError
                        ? "border-red-400 focus-visible:ring-red-400"
                        : ""
                    }`}
                    onChange={(event) => {
                      const parsed = parseNumericValue(event.target.value);
                      const nextValue = {
                        ...energyValue,
                        [variant.key]: {
                          hasInvoices:
                            variantValue.hasInvoices ||
                            (!!parsed && parsed > 0),
                          monthlyAmount: parsed
                        }
                      } as EnergyCompositeAnswer;
                      handleAnswerChange(question.id, nextValue);
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    {variantValue.hasInvoices
                      ? variantValue.monthlyAmount
                        ? `Montant enregistré : ${variantValue.monthlyAmount.toLocaleString(
                            "fr-FR"
                          )} €/mois`
                        : "Renseignez votre dépense mensuelle moyenne."
                      : "Aucune facture pour cette énergie."}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      switch (question.question_type) {
        case "choix_unique": {
          return (
            <select
              value={value ?? ""}
              onChange={(event) =>
                handleAnswerChange(
                  question.id,
                  event.target.value === "" ? null : event.target.value
                )
              }
              className={`h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isMissing ? "border-red-400 focus:ring-red-400" : ""
              }`}
            >
              <option value="">Sélectionnez une réponse</option>
              {(question.options?.choix || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        case "choix_multiple": {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              {(question.options?.choix || []).map((option) => {
                const checked = selectedValues.includes(option);
                return (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const current = Array.isArray(value) ? [...value] : [];
                        if (event.target.checked) {
                          if (!current.includes(option)) {
                            current.push(option);
                          }
                        } else {
                          const index = current.indexOf(option);
                          if (index >= 0) {
                            current.splice(index, 1);
                          }
                        }
                        handleAnswerChange(question.id, current);
                      }}
                      className="h-4 w-4"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          );
        }
        case "nombre": {
          return (
            <div className="space-y-1">
              <Input
                type="number"
                value={value ?? ""}
                onChange={(event) => {
                  handleAnswerChange(
                    question.id,
                    event.target.value === "" ? null : Number(event.target.value)
                  );
                }}
                placeholder={question.options?.placeholder || "Entrez votre réponse"}
                className={isMissing ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {question.options?.unite && (
                <p className="text-xs text-slate-500">
                  Unité : {question.options.unite}
                </p>
              )}
            </div>
          );
        }
        case "texte":
        default: {
          return (
            <Textarea
              value={value ?? ""}
              onChange={(event) => handleAnswerChange(question.id, event.target.value)}
              placeholder={question.options?.placeholder || "Entrez votre réponse"}
              className={`min-h-[100px] ${
                isMissing ? "border-red-400 focus-visible:ring-red-400" : ""
              }`}
            />
          );
        }
      }
    },
    [draftAnswers, handleAnswerChange, missingQuestions, shouldDisplayQuestion]
  );

  const handleScrollToQuestion = useCallback((questionId: string) => {
    const element = questionRefs.current[questionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      element.classList.add("ring", "ring-blue-300", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring", "ring-blue-300", "ring-offset-2");
      }, 1200);
    }
  }, []);

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600">
              Préparation de votre simulation personnalisée...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Synthèse de votre simulation
            </h1>
            <p className="text-sm text-slate-600">
              Consultez vos réponses, ajustez-les et mettez à jour vos montants d'éligibilité.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate("/dashboard/client")}
            >
              <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Simulation validée
              </CardTitle>
              <CardDescription>
                Résumé de la dernière simulation confirmée. Les montants affichés dans vos tuiles produits sont basés sur ces réponses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedSimulation ? (
                <>
                  {completedSimulation?.results?.total_savings && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      Gains potentiels estimés :
                      <span className="ml-2 font-semibold">
                        {completedSimulation.results.total_savings.toLocaleString("fr-FR")} €
                      </span>
                    </div>
                  )}
                  {renderAnswerSummary(completedSimulation.answers || {})}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas encore de simulation validée. Cliquez sur "Modifier mes réponses" pour démarrer.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit3 className="h-5 w-5 text-blue-500" />
                Brouillon en cours
              </CardTitle>
              <CardDescription>
                Vos modifications sont enregistrées automatiquement. Validez dès que toutes les réponses obligatoires sont renseignées.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {draftSimulation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                    >
                      Brouillon • {Object.keys(draftSimulation.answers || {}).length} réponse(s)
                    </Badge>
                    {saveStatus === "saving" && (
                      <Badge className="gap-1 bg-amber-100 text-amber-700">
                        <Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde...
                      </Badge>
                    )}
                    {saveStatus === "saved" && (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-700">
                        <Save className="h-3 w-3" /> Enregistré
                      </Badge>
                    )}
                    {saveStatus === "error" && (
                      <Badge className="gap-1 bg-red-100 text-red-700">
                        <AlertCircle className="h-3 w-3" /> Erreur d'enregistrement
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => setIsEditing(true)} variant="default">
                      Continuer la modification
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleFinalize}
                      disabled={finalizing}
                      className="flex items-center gap-2"
                    >
                      {finalizing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Validation...
                        </>
                      ) : (
                        "Valider ma simulation"
                      )}
                    </Button>
                  </div>

                  {!isEditing && renderAnswerSummary(draftSimulation.answers || {})}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Aucune modification en cours. Lancez une nouvelle simulation pour actualiser vos montants.
                  </p>
                  <Button onClick={handleStartEditing} className="w-fit">
                    Modifier mes réponses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isEditing && (
          <Card className="border border-blue-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                    <Edit3 className="h-5 w-5" /> Modifier mes réponses
                  </CardTitle>
                  <CardDescription>
                    Toute modification est enregistrée automatiquement. Vous pouvez quitter la page et revenir plus tard.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {saveStatus === "saving" && (
                    <Badge className="gap-1 bg-amber-100 text-amber-700">
                      <Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde...
                    </Badge>
                  )}
                  {saveStatus === "saved" && (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-700">
                      <Save className="h-3 w-3" /> Enregistré
                    </Badge>
                  )}
                  {saveStatus === "error" && (
                    <Badge className="gap-1 bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3" /> Erreur d'enregistrement
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {missingQuestions.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Certaines réponses obligatoires sont manquantes. Complétez-les avant de valider.
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  {phaseDefinitions.map((phase) => {
                    const unansweredInPhase = phase.questions.some((question) =>
                      missingQuestions.includes(question.id)
                    );
                    const label = phase.phase > 0 ? `Phase ${phase.phase}` : "Phase";
                    return (
                      <button
                        key={phase.phase}
                        type="button"
                        onClick={() =>
                          phase.questions.length > 0 &&
                          handleScrollToQuestion(phase.questions[0].id)
                        }
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                          unansweredInPhase
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-white/80 text-slate-700 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        <span>{label}</span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {phase.questions.length}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-4">
                  {questions.map((question) => {
                    const shouldShow = shouldDisplayQuestion(question, draftAnswers);
                    if (!shouldShow) {
                      return null;
                    }

                    const isRequired = question.validation_rules?.required;
                    const isMissing = missingQuestions.includes(question.id);

                    return (
                      <div
                        key={question.id}
                        ref={(element) => {
                          questionRefs.current[question.id] = element;
                        }}
                        className={`rounded-lg border bg-white/90 p-4 shadow-sm transition-all ${
                          isMissing ? "border-red-300" : "border-slate-200"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {question.question_text}
                            </p>
                            {question.description && (
                              <p className="text-xs text-slate-500">
                                {question.description}
                              </p>
                            )}
                          </div>
                          {isRequired && (
                            <Badge variant="outline" className="text-xs uppercase">
                              Obligatoire
                            </Badge>
                          )}
                        </div>
                        {renderQuestionInput(question)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEditing}
                  className="flex items-center gap-2"
                  disabled={finalizing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleFinalize}
                  className="flex items-center gap-2"
                  disabled={finalizing}
                >
                  {finalizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Validation...
                    </>
                  ) : (
                    "Valider la simulation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SimulateurClient;

