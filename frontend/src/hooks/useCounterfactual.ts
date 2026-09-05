import { useQuery, useMutation } from "@tanstack/react-query";
import { counterfactualService } from "@/services/counterfactual.service";
import type { SimulationRequest } from "@/types/counterfactual.types";

export const counterfactualQueryKey = (quotationId: string) => ["counterfactual-recommendations", quotationId];

export function useCounterfactual(quotationId: string) {
  const query = useQuery({
    queryKey: counterfactualQueryKey(quotationId),
    queryFn: () => counterfactualService.getRecommendations(quotationId),
    enabled: Boolean(quotationId),
  });

  const simulateMutation = useMutation({
    mutationFn: (req: SimulationRequest) => counterfactualService.simulate(req),
  });

  return {
    ...query,
    simulate: simulateMutation.mutateAsync,
    isSimulating: simulateMutation.isPending,
    simulationResult: simulateMutation.data,
  };
}
