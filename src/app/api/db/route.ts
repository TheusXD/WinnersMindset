import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, execute } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

const ALLOWED_TABLES = new Set([
  'perfis_usuarios',
  'solicitacoes_cadastro',
  'atletas',
  'atletas_roster',
  'treinos',
  'exercicios',
  'presencas',
  'presencas_roster',
  'avaliacoes',
  'jogos',
  'estatisticas_jogos',
  'pagamentos',
  'planos_treino',
  'plano_treino_dias',
  'treino_execucoes',
  'treinos_semana_atleta',
  'historico_corporal',
]);

interface FilterClause {
  column: string;
  op: 'eq' | 'neq' | 'in' | 'is' | 'gte' | 'lte' | 'gt' | 'lt' | 'like';
  value: any;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    const body = await request.json();
    const {
      table,
      action,
      select = '*',
      filters = [],
      order,
      limit,
      single = false,
      maybeSingle = false,
      data: payloadData,
      fnName,
      fnArgs,
    } = body;

    // Handle RPC functions (compatibility with Supabase RPC)
    if (action === 'rpc') {
      if (fnName === 'is_bootstrap_admin') {
        const isAdmin = sessionUser?.cargo === 'treinador' || sessionUser?.cargo === 'auxiliar';
        return NextResponse.json({ data: isAdmin, error: null });
      }

      if (fnName === 'get_email_by_phone') {
        const phoneDigits = String(fnArgs?.phone_input || '').replace(/\D/g, '');
        if (!phoneDigits) {
          return NextResponse.json({ data: null, error: null });
        }

        const profiles = await query<any>(
          'SELECT email, telefone FROM perfis_usuarios WHERE email IS NOT NULL AND telefone IS NOT NULL'
        );
        const matched = profiles.find((p: any) => String(p.telefone || '').replace(/\D/g, '') === phoneDigits);
        if (matched) {
          return NextResponse.json({ data: matched.email, error: null });
        }

        const athletes = await query<any>(
          'SELECT usuario_id, telefone FROM atletas WHERE telefone IS NOT NULL AND usuario_id IS NOT NULL'
        );
        const matchedAthlete = athletes.find((a: any) => String(a.telefone || '').replace(/\D/g, '') === phoneDigits);
        if (matchedAthlete) {
          const users = await query<any>('SELECT email FROM usuarios WHERE id = ? LIMIT 1', [matchedAthlete.usuario_id]);
          if (users.length > 0) {
            return NextResponse.json({ data: users[0].email, error: null });
          }
        }

        return NextResponse.json({ data: null, error: null });
      }

      if (fnName === 'bootstrap_own_profile') {
        if (!sessionUser) {
          return NextResponse.json({ data: null, error: { message: 'Não autenticado' } }, { status: 401 });
        }

        const profiles = await query<any>('SELECT * FROM perfis_usuarios WHERE id = ? LIMIT 1', [sessionUser.id]);
        if (profiles.length > 0) {
          return NextResponse.json({ data: profiles[0], error: null });
        }

        const newProfile = {
          id: sessionUser.id,
          nome: fnArgs?.display_nome || sessionUser.email.split('@')[0],
          cargo: sessionUser.cargo,
          email: sessionUser.email,
        };

        await execute(
          'INSERT INTO perfis_usuarios (id, nome, cargo, email) VALUES (?, ?, ?, ?)',
          [newProfile.id, newProfile.nome, newProfile.cargo, newProfile.email]
        );

        return NextResponse.json({ data: newProfile, error: null });
      }

      return NextResponse.json({ data: null, error: { message: `RPC ${fnName} não suportada.` } }, { status: 400 });
    }

    if (!table || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { data: null, error: { message: `Tabela inválida ou não permitida: ${table}` } },
        { status: 400 }
      );
    }

    // Build WHERE clause
    const whereParts: string[] = [];
    const queryParams: any[] = [];

    for (const f of filters as FilterClause[]) {
      if ((f.op as string) === 'or') {
        const orClauses = String(f.value || '').split(',');
        const subParts: string[] = [];
        for (const sub of orClauses) {
          const [col, op, ...rest] = sub.trim().split('.');
          const val = rest.join('.');
          const cleanCol = col?.replace(/[^a-zA-Z0-9_]/g, '');
          if (!cleanCol) continue;
          if (op === 'eq') {
            subParts.push(`\`${cleanCol}\` = ?`);
            queryParams.push(val);
          } else if (op === 'lt') {
            subParts.push(`\`${cleanCol}\` < ?`);
            queryParams.push(val);
          } else if (op === 'gt') {
            subParts.push(`\`${cleanCol}\` > ?`);
            queryParams.push(val);
          } else if (op === 'lte') {
            subParts.push(`\`${cleanCol}\` <= ?`);
            queryParams.push(val);
          } else if (op === 'gte') {
            subParts.push(`\`${cleanCol}\` >= ?`);
            queryParams.push(val);
          } else if (op === 'neq') {
            subParts.push(`\`${cleanCol}\` != ?`);
            queryParams.push(val);
          }
        }
        if (subParts.length > 0) {
          whereParts.push(`(${subParts.join(' OR ')})`);
        }
        continue;
      }

      // Basic sanitization of column name
      const colName = f.column.replace(/[^a-zA-Z0-9_]/g, '');
      if (!colName) continue;

      if (f.op === 'eq') {
        if (f.value === null) {
          whereParts.push(`\`${colName}\` IS NULL`);
        } else {
          whereParts.push(`\`${colName}\` = ?`);
          queryParams.push(f.value);
        }
      } else if (f.op === 'neq') {
        if (f.value === null) {
          whereParts.push(`\`${colName}\` IS NOT NULL`);
        } else {
          whereParts.push(`\`${colName}\` != ?`);
          queryParams.push(f.value);
        }
      } else if (f.op === 'in') {
        if (Array.isArray(f.value) && f.value.length > 0) {
          const placeholders = f.value.map(() => '?').join(', ');
          whereParts.push(`\`${colName}\` IN (${placeholders})`);
          queryParams.push(...f.value);
        } else {
          whereParts.push('1 = 0');
        }
      } else if (f.op === 'gte') {
        whereParts.push(`\`${colName}\` >= ?`);
        queryParams.push(f.value);
      } else if (f.op === 'lte') {
        whereParts.push(`\`${colName}\` <= ?`);
        queryParams.push(f.value);
      } else if (f.op === 'gt') {
        whereParts.push(`\`${colName}\` > ?`);
        queryParams.push(f.value);
      } else if (f.op === 'lt') {
        whereParts.push(`\`${colName}\` < ?`);
        queryParams.push(f.value);
      } else if (f.op === 'like') {
        whereParts.push(`\`${colName}\` LIKE ?`);
        queryParams.push(f.value);
      } else if ((f.op as string) === 'not') {
        const { subOp, value } = f.value || {};
        if (subOp === 'is' && value === null) {
          whereParts.push(`\`${colName}\` IS NOT NULL`);
        } else if (subOp === 'eq') {
          whereParts.push(`\`${colName}\` != ?`);
          queryParams.push(value);
        } else if (subOp === 'in' && Array.isArray(value) && value.length > 0) {
          const placeholders = value.map(() => '?').join(', ');
          whereParts.push(`\`${colName}\` NOT IN (${placeholders})`);
          queryParams.push(...value);
        } else {
          whereParts.push(`\`${colName}\` != ?`);
          queryParams.push(value);
        }
      }
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // ==========================================
    // ACTION: SELECT
    // ==========================================
    if (action === 'select') {
      if (body.selectOptions?.head) {
        const countSql = `SELECT COUNT(*) as total FROM \`${table}\` ${whereClause}`;
        const countRes = await query<any>(countSql, queryParams);
        const count = countRes && countRes[0] ? Number(countRes[0].total) : 0;
        return NextResponse.json({ data: null, error: null, count });
      }

      let orderClause = '';
      if (order && order.column) {
        const orderCol = order.column.replace(/[^a-zA-Z0-9_]/g, '');
        const dir = order.ascending === false ? 'DESC' : 'ASC';
        orderClause = `ORDER BY \`${orderCol}\` ${dir}`;
      }

      let limitClause = '';
      if (single || maybeSingle) {
        limitClause = 'LIMIT 1';
      } else if (limit && typeof limit === 'number') {
        limitClause = `LIMIT ${Math.max(1, Math.min(1000, limit))}`;
      }

      // Safe column selection
      const safeCols = select === '*' ? '*' : select.split(',').map((c: string) => {
        const clean = c.trim().replace(/[^a-zA-Z0-9_]/g, '');
        return clean ? `\`${clean}\`` : '*';
      }).join(', ');

      const sql = `SELECT ${safeCols} FROM \`${table}\` ${whereClause} ${orderClause} ${limitClause}`.trim();
      const rows = await query<any>(sql, queryParams);

      if (single) {
        if (!rows || rows.length === 0) {
          return NextResponse.json({
            data: null,
            error: { code: 'PGRST116', message: 'Nenhum registro encontrado.' },
          });
        }
        return NextResponse.json({ data: rows[0], error: null });
      }

      if (maybeSingle) {
        return NextResponse.json({ data: rows[0] || null, error: null });
      }

      return NextResponse.json({ data: rows, error: null });
    }

    // ==========================================
    // ACTION: INSERT
    // ==========================================
    if (action === 'insert') {
      const rowsToInsert = Array.isArray(payloadData) ? payloadData : [payloadData];
      if (rowsToInsert.length === 0) {
        return NextResponse.json({ data: [], error: null });
      }

      const insertedRows: any[] = [];

      for (const rawRow of rowsToInsert) {
        const row = { ...rawRow };
        // Generate UUID if not present
        if (!row.id) {
          row.id = crypto.randomUUID();
        }

        const keys = Object.keys(row).filter((k) => k.replace(/[^a-zA-Z0-9_]/g, '') === k);
        const cols = keys.map((k) => `\`${k}\``).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => {
          const val = row[k];
          if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });

        const sql = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`;
        await execute(sql, values);
        insertedRows.push(row);
      }

      return NextResponse.json({
        data: single || maybeSingle ? insertedRows[0] : insertedRows,
        error: null,
      });
    }

    // ==========================================
    // ACTION: UPDATE
    // ==========================================
    if (action === 'update') {
      if (!payloadData || Object.keys(payloadData).length === 0) {
        return NextResponse.json({ data: null, error: { message: 'Nenhum dado fornecido para atualização.' } });
      }

      const keys = Object.keys(payloadData).filter((k) => k.replace(/[^a-zA-Z0-9_]/g, '') === k);
      const setClauses = keys.map((k) => `\`${k}\` = ?`).join(', ');
      const setValues = keys.map((k) => {
        const val = payloadData[k];
        if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        return val;
      });

      if (whereParts.length === 0) {
        return NextResponse.json(
          { data: null, error: { message: 'Atualização sem filtro WHERE não é permitida por segurança.' } },
          { status: 400 }
        );
      }

      const sql = `UPDATE \`${table}\` SET ${setClauses} ${whereClause}`;
      await execute(sql, [...setValues, ...queryParams]);

      // Return updated row if requested
      const updatedRows = await query<any>(`SELECT * FROM \`${table}\` ${whereClause}`, queryParams);
      return NextResponse.json({
        data: single || maybeSingle ? updatedRows[0] || null : updatedRows,
        error: null,
      });
    }

    // ==========================================
    // ACTION: DELETE
    // ==========================================
    if (action === 'delete') {
      if (whereParts.length === 0) {
        return NextResponse.json(
          { data: null, error: { message: 'Exclusão sem filtro WHERE não é permitida por segurança.' } },
          { status: 400 }
        );
      }

      const sql = `DELETE FROM \`${table}\` ${whereClause}`;
      await execute(sql, queryParams);

      return NextResponse.json({ data: null, error: null });
    }

    // ==========================================
    // ACTION: UPSERT
    // ==========================================
    if (action === 'upsert') {
      const rowsToUpsert = Array.isArray(payloadData) ? payloadData : [payloadData];
      const upsertedRows: any[] = [];

      for (const rawRow of rowsToUpsert) {
        const row = { ...rawRow };
        if (!row.id) {
          row.id = crypto.randomUUID();
        }

        const keys = Object.keys(row).filter((k) => k.replace(/[^a-zA-Z0-9_]/g, '') === k);
        const cols = keys.map((k) => `\`${k}\``).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const updateClauses = keys
          .filter((k) => k !== 'id')
          .map((k) => `\`${k}\` = VALUES(\`${k}\`)`)
          .join(', ');

        const values = keys.map((k) => {
          const val = row[k];
          if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });

        const sql = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClauses || '`id` = `id`'}`;
        await execute(sql, values);
        upsertedRows.push(row);
      }

      return NextResponse.json({
        data: single || maybeSingle ? upsertedRows[0] : upsertedRows,
        error: null,
      });
    }

    return NextResponse.json(
      { data: null, error: { message: `Ação ${action} não suportada.` } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Database API route error:', error);
    return NextResponse.json(
      { data: null, error: { message: error?.message || 'Erro interno ao consultar banco de dados.' } },
      { status: 500 }
    );
  }
}
