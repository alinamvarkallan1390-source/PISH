/**
 * Nexora data layer.
 * Production: Neon serverless HTTP driver (Vercel friendly).
 * Local: PGlite (real Postgres in WASM) so we test the exact same SQL.
 */
export type Row = Record<string, any>;
export type QueryFn = (text: string, params?: any[]) => Promise<Row[]>;

declare global {
  // eslint-disable-next-line no-var
  var __nexoraDb: Promise<QueryFn> | undefined;
  // eslint-disable-next-line no-var
  var __nexoraReady: Promise<void> | undefined;
}

const isNeon = () =>
  !!process.env.DATABASE_URL && !process.env.NEXORA_FORCE_PGLITE;

async function createDb(): Promise<QueryFn> {
  if (isNeon()) {
    const { neon } = await import("@neondatabase/serverless");
    const url = process.env.DATABASE_URL as string;
    const sql = neon(url);
    return async (text: string, params: any[] = []) => {
      const res: any = await sql.query(text, params);
      return (Array.isArray(res) ? res : res?.rows ?? []) as Row[];
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.NEXORA_PGLITE_DIR || ".data/nexora";
  const db = new PGlite(dir);
  await (db as any).waitReady;
  return async (text: string, params: any[] = []) => {
    const res = await db.query(text, params);
    return (res.rows || []) as Row[];
  };
}

export function db(): Promise<QueryFn> {
  if (!globalThis.__nexoraDb) globalThis.__nexoraDb = createDb();
  return globalThis.__nexoraDb;
}

export async function q<T = Row>(text: string, params: any[] = []): Promise<T[]> {
  const sql = await db();
  return (await sql(text, params)) as T[];
}

export async function q1<T = Row>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/** Runs a single INSERT/UPDATE/DELETE returning affected rows. */
export async function exec(text: string, params: any[] = []): Promise<Row[]> {
  return q(text, params);
}
