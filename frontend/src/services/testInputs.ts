/** Ordered inputs for one test case. A case saved before this field existed stays a single input. */
export function listedInputs(tc: { input?: string; inputs?: string[] } | null | undefined): string[] {
  const many = tc?.inputs;
  if (Array.isArray(many) && many.length > 0) return many.map(value => String(value ?? ''));
  return [tc?.input ?? ''];
}
