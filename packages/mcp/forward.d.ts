export function forward(line: string, opts: { key: string; url: string; fetchImpl?: typeof fetch; waitMs?: number }): Promise<unknown>;
