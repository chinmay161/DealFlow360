import { useQuery } from "@tanstack/react-query";
import { ruleEngineService } from "@/services/rule-engine.service";

export const decisionTraceQueryKey = (quotationId: string) => ["decision-trace", quotationId];

export function useDecisionTrace(quotationId: string) {
  return useQuery({
    queryKey: decisionTraceQueryKey(quotationId),
    queryFn: () => ruleEngineService.getDecisionTrace(quotationId),
    enabled: Boolean(quotationId),
  });
}
