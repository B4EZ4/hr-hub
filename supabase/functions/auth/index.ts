import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
};

// Funciones de hashing compatibles con Edge Runtime usando Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const [saltHex, hashHex] = storedHash.split(':');

  // Intentar verificación PBKDF2 primero
  try {
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedHashHex === hashHex) {
      return true;
    }
  } catch (e) {
    // Si falla PBKDF2, intentar verificación SHA256 simple (para usuario inicial)
  }

  // Fallback: verificación SHA256 simple para usuario creado en migración
  const simpleHashData = encoder.encode(password + saltHex);
  const simpleHashBuffer = await crypto.subtle.digest('SHA-256', simpleHashData);
  const simpleHashArray = Array.from(new Uint8Array(simpleHashBuffer));
  const simpleHashHex = simpleHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return simpleHashHex === hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Parse body only for actions that need it
    let body: any = {};
    if (action === 'login' || action === 'signup' || action === 'reset-password') {
      try {
        body = await req.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Cuerpo de petición inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Login
    if (action === 'login') {
      const { username, password } = body;

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: 'Usuario y contraseña son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar usuario por username
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, profiles(department, position, areas(name), positions(title))')
        .eq('username', username.toLowerCase())
        .single();

      if (userError || !user) {
        // Log intento fallido
        await supabase.from('auth_audit').insert({
          email: username,
          action: 'failed_login',
          success: false,
          metadata: { reason: 'user_not_found' }
        });

        return new Response(
          JSON.stringify({ error: 'Credenciales inválidas' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar si está bloqueado
      if (user.is_locked) {
        return new Response(
          JSON.stringify({ error: 'Cuenta bloqueada. Contacte al administrador' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar contraseña
      const passwordMatch = await verifyPassword(password, user.password_hash);

      if (!passwordMatch) {
        // Incrementar intentos fallidos
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const shouldLock = failedAttempts >= 5;

        await supabase
          .from('users')
          .update({
            failed_login_attempts: failedAttempts,
            is_locked: shouldLock
          })
          .eq('id', user.id);

        await supabase.from('auth_audit').insert({
          user_id: user.id,
          email: user.email,
          action: 'failed_login',
          success: false,
          metadata: { failed_attempts: failedAttempts, locked: shouldLock }
        });

        return new Response(
          JSON.stringify({
            error: shouldLock
              ? 'Cuenta bloqueada por múltiples intentos fallidos'
              : 'Credenciales inválidas'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Login exitoso - crear sesión
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

      await supabase.from('user_sessions').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      // Resetear intentos fallidos y actualizar último login
      await supabase
        .from('users')
        .update({
          failed_login_attempts: 0,
          last_login_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Log login exitoso
      await supabase.from('auth_audit').insert({
        user_id: user.id,
        email: user.email,
        action: 'login',
        success: true
      });

      // Obtener roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            department: (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.areas?.name || (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.department || user.department,
            position: (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.positions?.title || (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.position || user.position,
            status: user.status
          },
          session: { token, expires_at: expiresAt.toISOString() },
          roles: roles?.map(r => r.role) || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Signup (protegido - solo para administradores o creación inicial)
    if (action === 'signup') {
      const { username, email, password, full_name, phone, role } = body;
      const sessionToken = req.headers.get('x-session-token');

      // Verificar si existen usuarios en el sistema
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Si hay usuarios, verificar que quien crea es administrador
      if (userCount && userCount > 0) {
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ error: 'No autorizado. Solo administradores pueden crear usuarios' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar sesión del administrador
        const { data: session } = await supabase
          .from('user_sessions')
          .select('user_id')
          .eq('token', sessionToken)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!session) {
          return new Response(
            JSON.stringify({ error: 'Sesión inválida o expirada' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar que el usuario es superadmin
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user_id)
          .in('role', ['superadmin', 'admin_rrhh'])
          .maybeSingle();

        if (!userRole) {
          return new Response(
            JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      if (!username || !email || !password || !full_name) {
        return new Response(
          JSON.stringify({ error: 'Usuario, email, contraseña y nombre son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar longitud de contraseña
      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Crear usuario
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          password_hash: passwordHash,
          full_name,
          phone,
          is_verified: true,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'El usuario o email ya está registrado' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Error al crear usuario' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Asignar rol: superadmin si es el primer usuario, o el rol especificado
      const assignedRole = (userCount === 0) ? 'superadmin' : (role || 'admin_rrhh');
      await supabase.from('user_roles').insert({
        user_id: newUser.id,
        role: assignedRole
      });

      // Log registro
      await supabase.from('auth_audit').insert({
        user_id: newUser.id,
        email: newUser.email,
        action: 'signup',
        success: true
      });

      return new Response(
        JSON.stringify({
          message: 'Usuario creado exitosamente',
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            full_name: newUser.full_name,
            role: assignedRole
          }
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Logout
    if (action === 'logout') {
      const sessionToken = req.headers.get('x-session-token');

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'No session token provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Eliminar sesión
      const { data: session } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('token', sessionToken)
        .single();

      if (session) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('token', sessionToken);

        await supabase.from('auth_audit').insert({
          user_id: session.user_id,
          action: 'logout',
          success: true
        });
      }

      return new Response(
        JSON.stringify({ message: 'Logout exitoso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset password (solo para administradores)
    if (action === 'reset-password') {
      const sessionToken = req.headers.get('x-session-token');

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar sesión del administrador
      const { data: session } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Sesión inválida o expirada' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar que el usuario es admin
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user_id)
        .in('role', ['superadmin', 'admin_rrhh'])
        .maybeSingle();

      if (!userRole) {
        return new Response(
          JSON.stringify({ error: 'Solo administradores pueden restablecer contraseñas' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { user_id, new_password } = body;

      if (!user_id || !new_password) {
        return new Response(
          JSON.stringify({ error: 'ID de usuario y nueva contraseña son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar longitud de contraseña
      if (new_password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash nueva contraseña
      const passwordHash = await hashPassword(new_password);

      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          failed_login_attempts: 0,
          is_locked: false
        })
        .eq('id', user_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Error al actualizar contraseña' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log acción
      await supabase.from('auth_audit').insert({
        user_id: user_id,
        action: 'password_reset',
        success: true,
        metadata: { reset_by: session.user_id }
      });

      return new Response(
        JSON.stringify({ message: 'Contraseña restablecida exitosamente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar sesión
    if (action === 'verify') {
      const sessionToken = req.headers.get('x-session-token');

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'No session token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session } = await supabase
        .from('user_sessions')
        .select('user_id, expires_at')
        .eq('token', sessionToken)
        .single();

      if (!session || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Sesión inválida o expirada' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Obtener datos del usuario
      const { data: user } = await supabase
        .from('users')
        .select('*, profiles(department, position, areas(name), positions(title))')
        .eq('id', session.user_id)
        .single();

      // Obtener roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user_id);

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            department: (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.areas?.name || (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.department || user.department,
            position: (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.positions?.title || (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles)?.position || user.position,
            status: user.status
          },
          roles: roles?.map(r => r.role) || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
