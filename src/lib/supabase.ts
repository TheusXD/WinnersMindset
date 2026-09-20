import { createClient } from '@supabase/supabase-js';

/**
 * Universal Database Client Adapter (Supabase & MySQL Dual-Mode)
 * 
 * Automatically connects directly to Supabase when NEXT_PUBLIC_SUPABASE_URL is present.
 * Seamlessly falls back to MySQL API bridges (/api/db, /api/auth) when NEXT_PUBLIC_DATABASE_DRIVER=mysql.
 */

type FilterOp = 'eq' | 'neq' | 'in' | 'is' | 'gte' | 'lte' | 'gt' | 'lt' | 'like';

interface FilterClause {
  column: string;
  op: FilterOp;
  value: any;
}

class QueryBuilder<T = any[]> implements PromiseLike<{ data: T | null; error: any; count: number | null }> {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectedCols: string = '*';
  private selectOptions?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean };
  private filters: FilterClause[] = [];
  private orderConfig?: { column: string; ascending?: boolean };
  private limitCount?: number;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private payloadData: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select<R = any[]>(columns: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): QueryBuilder<R> {
    this.selectedCols = columns;
    this.selectOptions = options;
    this.action = 'select';
    return this as unknown as QueryBuilder<R>;
  }

  insert(data: any): QueryBuilder<T> {
    this.action = 'insert';
    this.payloadData = data;
    return this;
  }

  update(data: any): QueryBuilder<T> {
    this.action = 'update';
    this.payloadData = data;
    return this;
  }

  delete(): QueryBuilder<T> {
    this.action = 'delete';
    return this;
  }

  upsert(data: any, _options?: any): QueryBuilder<T> {
    this.action = 'upsert';
    this.payloadData = data;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  in(column: string, value: any[]) {
    this.filters.push({ column, op: 'in', value });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ column, op: 'is', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, op: 'gt', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  like(column: string, value: any) {
    this.filters.push({ column, op: 'like', value });
    return this;
  }

  ilike(column: string, value: any) {
    this.filters.push({ column, op: 'like', value });
    return this;
  }

  or(clause: string) {
    this.filters.push({ column: '', op: 'or' as any, value: clause });
    return this;
  }

  filter(column: string, op: string, value: any) {
    this.filters.push({ column, op: op as FilterOp, value });
    return this;
  }

  not(column: string, op: string, value: any) {
    this.filters.push({ column, op: 'not' as any, value: { subOp: op, value } });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single<R = any>(): QueryBuilder<R> {
    this.isSingle = true;
    return this as unknown as QueryBuilder<R>;
  }

  maybeSingle<R = any>(): QueryBuilder<R> {
    this.isMaybeSingle = true;
    return this as unknown as QueryBuilder<R>;
  }

  async execute(): Promise<{ data: any; error: any; count: number | null }> {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          select: this.selectedCols,
          selectOptions: this.selectOptions,
          filters: this.filters,
          order: this.orderConfig,
          limit: this.limitCount,
          single: this.isSingle,
          maybeSingle: this.isMaybeSingle,
          data: this.payloadData,
        }),
      });

      const json = await res.json();
      const count = json.count !== undefined 
        ? json.count 
        : (Array.isArray(json.data) ? json.data.length : (json.data ? 1 : null));

      return {
        data: json.data,
        error: json.error,
        count,
      };
    } catch (err: any) {
      console.error('API query execution error:', err);
      return { data: null, error: { message: err?.message || 'Erro de conexão com o servidor.' }, count: null };
    }
  }

  then<TResult1 = { data: T | null; error: any; count: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Authentication listeners
const authListeners = new Set<(event: string, session: any) => void>();

const auth = {
  async getSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return { data: { session: null }, error: null };
      const json = await res.json();
      if (json.user) {
        return { data: { session: { user: json.user } }, error: null };
      }
      return { data: { session: null }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners.delete(callback);
          },
        },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        return { data: { user: null, session: null }, error: { message: json.error || 'Erro ao efetuar login.' } };
      }
      const session = { user: json.user };
      authListeners.forEach((cb) => cb('SIGNED_IN', session));
      return { data: { user: json.user, session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err?.message || 'Falha de comunicação.' } };
    }
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: any } }) {
    try {
      const payload = {
        email,
        password,
        ...(options?.data || {}),
      };
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        return { data: { user: null, session: null }, error: { message: json.error || 'Erro no cadastro.' } };
      }
      return { data: { user: { id: json.userId, email }, session: null }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err?.message || 'Falha ao cadastrar.' } };
    }
  },

  async signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      authListeners.forEach((cb) => cb('SIGNED_OUT', null));
      return { error: null };
    } catch {
      return { error: null };
    }
  },

  async updateUser({ password }: { password?: string }) {
    try {
      const res = await fetch('/api/auth/updateUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        return { data: null, error: { message: json.error || 'Erro ao atualizar usuário.' } };
      }
      return { data: json, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'Falha ao atualizar.' } };
    }
  },

  async resetPasswordForEmail(email: string, _options?: any) {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      return { data: json, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'Erro ao solicitar redefinição.' } };
    }
  },
};

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File, _options?: any) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', path);
          formData.append('bucket', bucket);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const json = await res.json();
          if (!res.ok || json.error) {
            throw new Error(json.error || 'Erro ao enviar arquivo.');
          }
          return { data: json, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      getPublicUrl(path: string) {
        return {
          data: {
            publicUrl: `/uploads/${bucket}/${path.replace(/\\/g, '/')}`,
          },
        };
      },
    };
  },
};

async function rpc(fnName: string, fnArgs?: any) {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rpc', fnName, fnArgs }),
    });
    return await res.json();
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Erro ao chamar função RPC.' } };
  }
}

const isMySQL = process.env.NEXT_PUBLIC_DATABASE_DRIVER === 'mysql';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!isMySQL && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env.local file.');
}

const nativeClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      ...(typeof window !== 'undefined' ? { storage: window.sessionStorage } : {}),
    },
  }
);

export const supabase = (!isMySQL && supabaseUrl && supabaseAnonKey)
  ? nativeClient
  : ({
      from<T = any[]>(table: string) {
        return new QueryBuilder<T>(table);
      },
      rpc,
      auth,
      storage,
    } as unknown as typeof nativeClient);

