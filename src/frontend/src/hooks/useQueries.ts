import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "../backend.d";
import type { ClassificationRecord } from "../backend.d";
import { useActor } from "./useActor";

export { Label };
export type { ClassificationRecord };

export function useGetAllRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<ClassificationRecord[]>({
    queryKey: ["records"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      message,
      label,
      confidence,
    }: {
      message: string;
      label: Label;
      confidence: number;
    }) => {
      if (!actor) return;
      await actor.addRecord(message, label, confidence);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useSeedDemoData() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      await actor.seedDemoData();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["records"] });
    },
  });
}
