# Setup Inicial del Sistema RRHH

## Crear Superadmin Inicial

Para acceder al sistema por primera vez, necesitas crear un usuario superadmin:

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Authentication → Users → Add User
3. Email: `admin@sistema-rrhh.com`
4. Password: `Admin123!` (CAMBIAR después del primer login)
5. Confirma el usuario automáticamente
6. Ve a SQL Editor y ejecuta:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users
WHERE email = 'admin@sistema-rrhh.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Opción 2: Desde el formulario de registro

1. Regístrate en la aplicación con:
   - Email: `admin@sistema-rrhh.com`
   - Nombre: `Administrador del Sistema`
   - Contraseña: `Admin123!`

2. Ve a Supabase Dashboard → SQL Editor y ejecuta:

```sql
UPDATE public.user_roles
SET role = 'superadmin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@sistema-rrhh.com');
```

## Credenciales Iniciales

```
Email: admin@sistema-rrhh.com
Password: Admin123!
```

⚠️ **IMPORTANTE**: Cambiar esta contraseña inmediatamente después del primer login.

## Roles Disponibles

- `superadmin`: Acceso total al sistema
- `admin_rrhh`: Gestión de usuarios, contratos, documentos
- `manager`: Aprobación de vacaciones, visualización de equipos
- `empleado`: Acceso básico (vacaciones, documentos públicos)
- `oficial_sh`: Gestión de Seguridad e Higiene
- `auditor`: Visualización de logs y auditorías

## Política de Acceso y Contraseñas

- **Sin auto-registro**: Ningún colaborador puede crear su cuenta desde la pantalla de login. Todas las altas deben pasar por RRHH.
- **Restablecimientos manuales**: Cuando un usuario pierde su contraseña, RRHH debe generar una nueva desde Supabase Dashboard o forzar el flujo de “must_change_password”.
- **Contacto oficial**: Comunica a las áreas usuarias el canal interno (ej. `rrhh@empresa.com` o mesa de ayuda) para solicitar altas/bajas y desbloqueos.
- **Comunicación en la UI**: La pantalla de login muestra un aviso indicando que los accesos están controlados; mantén actualizado el correo o canal de contacto mencionado.

## Siguientes Pasos

1. Login con las credenciales del superadmin
2. Ir a Usuarios → Nuevo Usuario para crear más cuentas
3. Asignar roles según sea necesario
4. Configurar sectores en Seguridad e Higiene
5. Cargar documentos iniciales

## Estructura de Módulos

### Seguridad e Higiene (Incluye TODO el inventario)
- **Inspecciones**: Programar y completar inspecciones
- **Checklists**: Listas de verificación reutilizables
- **Inventario**: EPP, herramientas, equipos (TODO aquí, no módulo separado)
- **Sectores**: Áreas de trabajo y riesgo

### Otros Módulos
- Usuarios
- Contratos
- Vacaciones
- Incidencias
- Documentos

## Notas de Seguridad

- RLS (Row Level Security) está habilitado en todas las tablas
- Los documentos pueden ser públicos o privados
- Solo superadmin puede gestionar roles
- Archivos se almacenan en Supabase Storage con políticas de acceso
