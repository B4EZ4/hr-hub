import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
};

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
    const body = await req.json();

    // Login
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email y contraseña son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar usuario
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !user) {
        // Log intento fallido
        await supabase.from('auth_audit').insert({
          email,
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
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

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
          email,
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
        email,
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
            department: user.department,
            position: user.position,
            status: user.status
          },
          session: { token, expires_at: expiresAt.toISOString() },
          roles: roles?.map(r => r.role) || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Signup
    if (action === 'signup') {
      const { email, password, full_name, phone, department, position } = body;

      if (!email || !password || !full_name) {
        return new Response(
          JSON.stringify({ error: 'Email, contraseña y nombre son requeridos' }),
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
      const passwordHash = await bcrypt.hash(password);

      // Crear usuario
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          full_name,
          phone,
          department,
          position,
          is_verified: true, // Auto-verificado por ahora
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') { // Unique violation
          return new Response(
            JSON.stringify({ error: 'El email ya está registrado' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Error al crear usuario' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Asignar rol por defecto (empleado)
      await supabase.from('user_roles').insert({
        user_id: newUser.id,
        role: 'empleado'
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
            email: newUser.email,
            full_name: newUser.full_name
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
        .select('*')
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
            department: user.department,
            position: user.position,
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
