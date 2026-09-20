import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, execute } from '@/lib/db';
import { 
  hashPassword, 
  comparePassword, 
  signToken, 
  getSessionUser 
} from '@/lib/auth-server';

const ADMIN_EMAILS = [
  'admin@legionarios.com',
  'treinador@legionarios.com',
  'professor@wm.com'
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  try {
    if (action === 'login') {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: 'E-mail e senha são obrigatórios.' },
          { status: 400 }
        );
      }

      const users = await query<any>(
        'SELECT id, email, senha_hash FROM usuarios WHERE email = ? LIMIT 1',
        [email.trim().toLowerCase()]
      );

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: 'E-mail ou senha inválidos.' },
          { status: 401 }
        );
      }

      const user = users[0];
      const passwordMatches = await comparePassword(password, user.senha_hash);

      if (!passwordMatches) {
        return NextResponse.json(
          { error: 'E-mail ou senha inválidos.' },
          { status: 401 }
        );
      }

      // Check profile
      let profiles = await query<any>(
        'SELECT * FROM perfis_usuarios WHERE id = ? LIMIT 1',
        [user.id]
      );

      let profile = profiles[0];
      const isStaffEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());

      if (!profile) {
        const defaultCargo = isStaffEmail ? 'treinador' : 'atleta';
        await execute(
          'INSERT INTO perfis_usuarios (id, nome, cargo, email) VALUES (?, ?, ?, ?)',
          [user.id, user.email.split('@')[0], defaultCargo, user.email]
        );
        profiles = await query<any>(
          'SELECT * FROM perfis_usuarios WHERE id = ? LIMIT 1',
          [user.id]
        );
        profile = profiles[0];
      }

      // Check approval for athletes
      if (profile.cargo === 'atleta' && !isStaffEmail) {
        const requests = await query<any>(
          'SELECT status FROM solicitacoes_cadastro WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 1',
          [user.id]
        );

        if (requests && requests.length > 0) {
          const reqStatus = requests[0].status;
          if (reqStatus === 'pendente') {
            return NextResponse.json(
              { error: 'Aguardando aprovação do administrador.' },
              { status: 403 }
            );
          }
          if (reqStatus === 'recusado') {
            return NextResponse.json(
              { error: 'Sua solicitação de cadastro foi recusada pelo administrador.' },
              { status: 403 }
            );
          }
        }
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        cargo: profile.cargo,
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email },
        profile,
        token,
      });

      // Set auth cookie
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    if (action === 'register') {
      const body = await request.json();
      const {
        email,
        password,
        nome,
        telefone,
        data_nascimento,
        categoria,
        posicao,
        cpf,
        rg,
        nome_pai,
        nome_mae,
        endereco,
        peso,
        altura,
        nivel_atividade,
        resistencia,
        equilibrio,
        flexibilidade,
        coordenacao_motora,
        potencia,
        pontos_total,
      } = body;

      if (!email || !password || !nome) {
        return NextResponse.json(
          { error: 'Nome, e-mail e senha são obrigatórios.' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await query<any>(
        'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
        [cleanEmail]
      );

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado no sistema.' },
          { status: 400 }
        );
      }

      const userId = crypto.randomUUID();
      const senhaHash = await hashPassword(password);
      const isStaffEmail = ADMIN_EMAILS.includes(cleanEmail);
      const cargo = isStaffEmail ? 'treinador' : 'atleta';

      // 1. Create user
      await execute(
        'INSERT INTO usuarios (id, email, senha_hash) VALUES (?, ?, ?)',
        [userId, cleanEmail, senhaHash]
      );

      // 2. Create profile
      await execute(
        'INSERT INTO perfis_usuarios (id, nome, cargo, email, telefone) VALUES (?, ?, ?, ?, ?)',
        [userId, nome.trim(), cargo, cleanEmail, telefone || null]
      );

      // 3. Create registration request
      const solicitacaoId = crypto.randomUUID();
      const parsedPeso = peso ? parseFloat(peso) : null;
      const parsedAltura = altura ? parseFloat(altura) : null;
      const parsedNivel = nivel_atividade ? parseInt(nivel_atividade, 10) : 1;

      const parsedResistencia = resistencia ? parseInt(resistencia, 10) : 3;
      const parsedEquilibrio = equilibrio ? parseInt(equilibrio, 10) : 3;
      const parsedFlexibilidade = flexibilidade ? parseInt(flexibilidade, 10) : 3;
      const parsedCoordenacao = coordenacao_motora ? parseInt(coordenacao_motora, 10) : 3;
      const parsedPotencia = potencia ? parseInt(potencia, 10) : 3;
      const parsedPontosTotal = pontos_total 
        ? parseInt(pontos_total, 10) 
        : (parsedResistencia + parsedEquilibrio + parsedFlexibilidade + parsedCoordenacao + parsedPotencia);

      await execute(
        `INSERT INTO solicitacoes_cadastro (
          id, usuario_id, email, nome, telefone, data_nascimento, 
          cpf, rg, nome_pai, nome_mae, endereco, status, posicao, categoria,
          peso, altura, nivel_atividade,
          resistencia, equilibrio, flexibilidade, coordenacao_motora, potencia, pontos_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          solicitacaoId,
          userId,
          cleanEmail,
          nome.trim(),
          telefone || null,
          data_nascimento || null,
          cpf || null,
          rg || null,
          nome_pai || null,
          nome_mae || null,
          endereco || null,
          isStaffEmail ? 'aprovado' : 'pendente',
          posicao || null,
          categoria || null,
          parsedPeso,
          parsedAltura,
          parsedNivel,
          parsedResistencia,
          parsedEquilibrio,
          parsedFlexibilidade,
          parsedCoordenacao,
          parsedPotencia,
          parsedPontosTotal,
        ]
      );

      return NextResponse.json({
        success: true,
        message: isStaffEmail 
          ? 'Conta de administrador criada com sucesso!' 
          : 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
        userId,
      });
    }

    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_token', '', {
        httpOnly: true,
        path: '/',
        expires: new Date(0),
      });
      return response;
    }

    if (action === 'reset-password') {
      const body = await request.json();
      const { email, newPassword } = body;

      if (!email || !newPassword) {
        return NextResponse.json(
          { error: 'E-mail e nova senha são obrigatórios.' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const users = await query<any>(
        'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
        [cleanEmail]
      );

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: 'E-mail não encontrado no sistema.' },
          { status: 404 }
        );
      }

      const senhaHash = await hashPassword(newPassword);
      await execute(
        'UPDATE usuarios SET senha_hash = ? WHERE id = ?',
        [senhaHash, users[0].id]
      );

      return NextResponse.json({
        success: true,
        message: 'Senha atualizada com sucesso!',
      });
    }

    if (action === 'updateUser') {
      const sessionUser = await getSessionUser(request);
      if (!sessionUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
      }

      const body = await request.json();
      const { password } = body;

      if (password) {
        const senhaHash = await hashPassword(password);
        await execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, sessionUser.id]);
      }

      return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso!' });
    }

    return NextResponse.json({ error: 'Ação não encontrada.' }, { status: 404 });
  } catch (error: any) {
    console.error(`Error in /api/auth/${action}:`, error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno no servidor de autenticação.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action === 'me') {
    try {
      const sessionUser = await getSessionUser(request);
      if (!sessionUser) {
        return NextResponse.json({ user: null, profile: null });
      }

      const profiles = await query<any>(
        'SELECT * FROM perfis_usuarios WHERE id = ? LIMIT 1',
        [sessionUser.id]
      );

      return NextResponse.json({
        user: { id: sessionUser.id, email: sessionUser.email },
        profile: profiles[0] || null,
      });
    } catch (error: any) {
      console.error('Error fetching /api/auth/me:', error);
      return NextResponse.json({ user: null, profile: null });
    }
  }

  return NextResponse.json({ error: 'Método não permitido.' }, { status: 405 });
}
