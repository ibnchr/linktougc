import type { UgcOutput } from "@/types";

interface StoredOutput extends UgcOutput {}

const results = new Map<string, StoredOutput>();

export function storeOutput(output: StoredOutput) {
  results.set(output.id, output);
}

export function getOutput(id: string): StoredOutput | undefined {
  return results.get(id);
}
