# 📊 INFORME DE DATOS DE MUESTRA (SEED) - SISTEMA RRHH

**Fecha de generación:** 16 de noviembre de 2025  
**Base de datos:** Lovable Cloud / Supabase  
**Estado:** ✅ Datos insertados correctamente

---

## 🔐 CREDENCIALES DE USUARIOS

### Usuarios Existentes (Roles Asignados)

| Email | Rol | Nombre | Contraseña |
|-------|-----|--------|------------|
| admin@sistema-rrhh.com | **superadmin** | Antonio Ramírez | *(usar contraseña existente)* |
| admin@gmail.com | **admin_rrhh** | María González | *(usar contraseña existente)* |

### ⚠️ USUARIOS PENDIENTES DE CREACIÓN

Los siguientes usuarios **DEBEN ser creados manualmente** mediante el sistema de autenticación de Supabase (signup):

| Email | Contraseña Temporal | Rol | Nombre | Debe Cambiar Password |
|-------|---------------------|-----|--------|----------------------|
| manager@demo.local | `TempPass!1M` | manager | Carlos Fernández | ✅ Sí |
| empleado@demo.local | `TempPass!1E` | empleado | Laura Méndez | ✅ Sí |
| oficial.sh@demo.local | `TempPass!1O` | oficial_sh | Roberto Silva | ✅ Sí |
| auditor@demo.local | `TempPass!1A` | auditor | Patricia Ruiz | ✅ Sí |

**UUID asignados para los perfiles:**
- Manager: `11111111-1111-1111-1111-111111111111`
- Empleado: `22222222-2222-2222-2222-222222222222`
- Oficial SH: `33333333-3333-3333-3333-333333333333`
- Auditor: `44444444-4444-4444-4444-444444444444`

> **NOTA IMPORTANTE:** Una vez creados estos usuarios mediante signup, deberás ejecutar los inserts de perfiles y roles manualmente para vincularlos.

---

## 📦 DATOS INSERTADOS POR TABLA

### 1. **Roles de Usuario** (`user_roles`)
- **Total:** 2 registros
- **Roles asignados:** superadmin, admin_rrhh

### 2. **Sectores de Seguridad e Higiene** (`sh_sectors`)
- **Total:** 4 sectores

| ID | Nombre | Nivel de Riesgo | Responsable |
|----|--------|-----------------|-------------|
| aaaaaaaa-aaaa-... | Planta de Producción | Alto | Antonio Ramírez |
| bbbbbbbb-bbbb-... | Depósito General | Medio | María González |
| cccccccc-cccc-... | Oficinas Administrativas | Bajo | María González |
| dddddddd-dddd-... | Laboratorio | Medio | Antonio Ramírez |

### 3. **Plantillas de Checklists** (`sh_checklists`)
- **Total:** 2 plantillas

| ID | Nombre | Categoría | Items |
|----|--------|-----------|-------|
| eeeeeeee-eeee-... | Inspección General de Seguridad | inspeccion | 5 items |
| ffffffff-ffff-... | Checklist EPP - Dotación Personal | epp | 4 items |

### 4. **Items de Inventario** (`inventory_items`)
- **Total:** 9 items

| ID | Nombre | Categoría | Stock | Min Stock | Estado |
|----|--------|-----------|-------|-----------|--------|
| 10000000-0000-...001 | Casco de Seguridad Blanco | epp | 23 | 10 | disponible |
| 10000000-0000-...002 | Guantes de Nitrilo (Caja x100) | epp | 6 | 5 | disponible |
| 10000000-0000-...003 | Extintor PQS 10kg | equipo | 12 | 8 | disponible |
| 10000000-0000-...004 | Botiquín Primeros Auxilios | material | 6 | 3 | disponible |
| 10000000-0000-...005 | Silla Ergonómica Oficina | equipo | 3 | 2 | disponible |
| 10000000-0000-...006 | Detector de Humo | equipo | 15 | 5 | disponible |
| 10000000-0000-...007 | Calzado de Seguridad Talle 42 | epp | 4 | 8 | disponible |
| 10000000-0000-...008 | Destornillador Set x12 | herramienta | 15 | 5 | disponible |
| 10000000-0000-...009 | Taladro Percutor Eléctrico | herramienta | 3 | 2 | disponible |

### 5. **Inspecciones** (`sh_inspections`)
- **Total:** 3 inspecciones

| Sector | Inspector | Fecha | Estado |
|--------|-----------|-------|--------|
| Planta de Producción | Antonio | 2025-11-01 | completada ✅ |
| Depósito General | María | 2025-11-15 | en_curso 🔄 |
| Oficinas Administrativas | Antonio | 2025-11-20 | programada 📅 |

### 6. **Evaluaciones de Área** (`sh_area_evaluations`)
- **Total:** 2 evaluaciones

| Sector | Evaluador | Fecha | Puntuación Promedio |
|--------|-----------|-------|---------------------|
| Planta de Producción | Antonio | 2025-10-15 | 8.2 / 10 |
| Oficinas Administrativas | María | 2025-11-10 | 9.2 / 10 |

### 7. **Mantenimientos** (`inventory_maintenance`)
- **Total:** 3 registros

| Item | Tipo | Fecha | Estado | Costo |
|------|------|-------|--------|-------|
| Extintor PQS 10kg | preventivo | 2025-12-01 | pendiente | $2,500 |
| Detector de Humo | preventivo | 2025-11-25 | en_proceso | $450 |
| Taladro Percutor | correctivo | 2025-10-20 | completado | $8,500 |

### 8. **Asignaciones de Inventario** (`inventory_assignments`)
- **Total:** 2 asignaciones

| Item | Usuario | Cantidad | Estado | Fecha |
|------|---------|----------|--------|-------|
| Cascos de Seguridad | María González | 2 | asignado | 2025-11-10 |
| Set Destornilladores | Antonio Ramírez | 1 | devuelto | 2025-10-15 - 2025-11-05 |

### 9. **Movimientos de Inventario** (`inventory_movements`)
- **Total:** 5 movimientos registrados en historial

### 10. **Contratos** (`contracts`)
- **Total:** 2 contratos

| Usuario | Número | Tipo | Posición | Salario | Estado |
|---------|--------|------|----------|---------|--------|
| María González | CONT-2022-001 | indefinido | Administrador RRHH | $125,000 | activo |
| Antonio Ramírez | CONT-2021-005 | indefinido | Superadministrador | $180,000 | activo |

### 11. **Solicitudes de Vacaciones** (`vacation_requests`)
- **Total:** 3 solicitudes

| Usuario | Fecha | Días | Estado | Aprobador |
|---------|-------|------|--------|-----------|
| María González | 2025-12-20 a 2026-01-05 | 10 | aprobado ✅ | Antonio |
| Antonio Ramírez | 2025-11-25 a 2025-11-29 | 5 | pendiente ⏳ | - |
| María González | 2025-10-10 a 2025-10-15 | 4 | rechazado ❌ | Antonio |

### 12. **Balances de Vacaciones** (`vacation_balances`)
- **Total:** 2 registros

| Usuario | Año | Total | Usados | Disponibles |
|---------|-----|-------|--------|-------------|
| María González | 2025 | 14 | 10 | 4 |
| Antonio Ramírez | 2025 | 21 | 0 | 21 |

### 13. **Incidentes** (`incidents`)
- **Total:** 4 incidentes

| Título | Tipo | Severidad | Estado | Ubicación |
|--------|------|-----------|--------|-----------|
| Derrame de líquido en pasillo | incidente | media | resuelto | Planta de Producción |
| Falla sistema ventilación | condicion_insegura | alta | en_progreso | Depósito General |
| Extintor descargado | incidente | media | abierto | Oficinas Admin |
| Caída de trabajador | accidente | alta | cerrado | Depósito - Zona carga |

### 14. **Documentos** (`documents`)
- **Total:** 3 documentos

| Título | Categoría | Público | Tags | Versión |
|--------|-----------|---------|------|---------|
| Política de Seguridad e Higiene 2025 | politica | Sí | seguridad, higiene, politica | 1 |
| Contrato Laboral - María González | contrato | No | contrato, rrhh, confidencial | 1 |
| Manual de Uso de EPP | capacitacion | Sí | epp, capacitacion, seguridad | 2 |

---

## ✅ QUERIES DE VERIFICACIÓN

Ejecuta estas queries para confirmar que los datos están correctamente insertados:

```sql
-- 1. Verificar usuarios con roles
SELECT p.full_name, p.email, ur.role 
FROM profiles p 
LEFT JOIN user_roles ur ON p.user_id = ur.user_id 
ORDER BY p.full_name;

-- 2. Verificar sectores y responsables
SELECT s.name, s.risk_level, p.full_name as responsable
FROM sh_sectors s
LEFT JOIN profiles p ON s.responsible_id = p.user_id;

-- 3. Verificar checklists activos
SELECT name, category, 
       jsonb_array_length(items) as num_items,
       is_active
FROM sh_checklists
ORDER BY category;

-- 4. Verificar inventario y stock crítico
SELECT name, category, stock_quantity, min_stock,
       CASE 
         WHEN stock_quantity < min_stock THEN '⚠️ CRÍTICO'
         WHEN stock_quantity <= min_stock * 1.2 THEN '⚡ BAJO'
         ELSE '✅ OK'
       END as nivel_stock
FROM inventory_items
ORDER BY stock_quantity - min_stock;

-- 5. Verificar inspecciones por estado
SELECT s.name as sector, 
       i.scheduled_date, 
       i.status,
       p.full_name as inspector
FROM sh_inspections i
JOIN sh_sectors s ON i.sector_id = s.id
JOIN profiles p ON i.inspector_id = p.user_id
ORDER BY i.scheduled_date DESC;

-- 6. Verificar incidentes abiertos o en progreso
SELECT title, incident_type, severity, status, 
       p.full_name as reportado_por
FROM incidents i
JOIN profiles p ON i.reported_by = p.user_id
WHERE status IN ('abierto', 'en_progreso')
ORDER BY severity DESC, created_at DESC;

-- 7. Verificar contratos activos
SELECT p.full_name, c.position, c.department, 
       c.start_date, c.salary, c.status
FROM contracts c
JOIN profiles p ON c.user_id = p.user_id
WHERE c.status = 'activo';

-- 8. Verificar solicitudes de vacaciones pendientes
SELECT p.full_name, 
       vr.start_date, vr.end_date, 
       vr.days_requested, vr.status
FROM vacation_requests vr
JOIN profiles p ON vr.user_id = p.user_id
ORDER BY vr.start_date;

-- 9. Verificar asignaciones activas de inventario
SELECT p.full_name, 
       i.name as item, 
       a.quantity, 
       a.assigned_date,
       a.status
FROM inventory_assignments a
JOIN profiles p ON a.user_id = p.user_id
JOIN inventory_items i ON a.item_id = i.id
WHERE a.status = 'asignado';

-- 10. Resumen completo de datos
SELECT 
  'Usuarios con rol' as concepto, COUNT(DISTINCT user_id)::text as cantidad
FROM user_roles
UNION ALL
SELECT 'Sectores', COUNT(*)::text FROM sh_sectors
UNION ALL
SELECT 'Checklists activos', COUNT(*)::text FROM sh_checklists WHERE is_active = true
UNION ALL
SELECT 'Items de inventario', COUNT(*)::text FROM inventory_items
UNION ALL
SELECT 'Inspecciones', COUNT(*)::text FROM sh_inspections
UNION ALL
SELECT 'Contratos activos', COUNT(*)::text FROM contracts WHERE status = 'activo'
UNION ALL
SELECT 'Solicitudes vacaciones', COUNT(*)::text FROM vacation_requests
UNION ALL
SELECT 'Incidentes', COUNT(*)::text FROM incidents
UNION ALL
SELECT 'Documentos', COUNT(*)::text FROM documents;
```

---

## 🗑️ SCRIPT DE LIMPIEZA (ROLLBACK)

**⚠️ PRECAUCIÓN:** Este script eliminará TODOS los datos de muestra insertados. Ejecutar solo si deseas limpiar la base de datos.

```sql
-- ===============================================
-- SCRIPT DE LIMPIEZA - ELIMINAR DATOS DE SEED
-- ===============================================

-- IMPORTANTE: Ejecutar en orden inverso para respetar foreign keys

-- 1. Eliminar movimientos de inventario
DELETE FROM inventory_movements 
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

-- 2. Eliminar asignaciones de inventario
DELETE FROM inventory_assignments 
WHERE id IN (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002'
);

-- 3. Eliminar mantenimientos
DELETE FROM inventory_maintenance 
WHERE id IN (
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000003'
);

-- 4. Eliminar evaluaciones de área
DELETE FROM sh_area_evaluations 
WHERE id IN (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002'
);

-- 5. Eliminar inspecciones
DELETE FROM sh_inspections 
WHERE id IN (
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003'
);

-- 6. Eliminar checklists
DELETE FROM sh_checklists 
WHERE id IN (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- 7. Eliminar sectores
DELETE FROM sh_sectors 
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- 8. Eliminar items de inventario (restaurar stock si es necesario antes)
DELETE FROM inventory_items 
WHERE id LIKE '10000000-0000-0000-0000-%';

-- 9. Eliminar documentos
DELETE FROM documents 
WHERE id LIKE '90000000-0000-0000-0000-%';

-- 10. Eliminar incidentes
DELETE FROM incidents 
WHERE id LIKE '80000000-0000-0000-0000-%';

-- 11. Eliminar balances de vacaciones
DELETE FROM vacation_balances 
WHERE id LIKE 'b0000000-0000-0000-0000-%';

-- 12. Eliminar solicitudes de vacaciones
DELETE FROM vacation_requests 
WHERE id LIKE '70000000-0000-0000-0000-%';

-- 13. Eliminar contratos
DELETE FROM contracts 
WHERE id LIKE '60000000-0000-0000-0000-%';

-- 14. Eliminar roles de usuarios demo (opcional - comentado por seguridad)
-- DELETE FROM user_roles WHERE user_id IN (
--   '6bdd634e-53a0-46db-b997-db258c2a4b2b',
--   'f76c8d54-0fba-4480-ac76-108a4356b629'
-- );

-- 15. Si creaste los usuarios adicionales, eliminar sus perfiles
-- DELETE FROM profiles WHERE email LIKE '%@demo.local';

-- NOTA: Los usuarios en auth.users deben eliminarse manualmente desde la UI de autenticación
```

### Script de limpieza alternativo (por patrón):

```sql
-- Limpieza basada en email pattern (más seguro)
DELETE FROM inventory_movements WHERE authorized_by IN (
  SELECT user_id FROM profiles WHERE email IN ('admin@sistema-rrhh.com', 'admin@gmail.com')
) AND created_at >= '2025-11-16';

DELETE FROM vacation_requests WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email IN ('admin@sistema-rrhh.com', 'admin@gmail.com')
);

DELETE FROM contracts WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email IN ('admin@sistema-rrhh.com', 'admin@gmail.com')
);

-- Y así sucesivamente...
```

---

## 🔒 NOTAS DE SEGURIDAD

### ⚠️ ADVERTENCIAS CRÍTICAS

1. **Contraseñas Temporales**
   - Las contraseñas listadas en este documento son TEMPORALES
   - DEBEN ser cambiadas en el primer login (campo `must_change_password = true`)
   - Rotar INMEDIATAMENTE en entorno de producción
   - No usar estas contraseñas en ningún ambiente productivo

2. **Usuarios Demo**
   - Todos los usuarios con email `@demo.local` son FICTICIOS
   - Eliminar antes de pasar a producción
   - No contienen datos personales reales

3. **Datos Sensibles**
   - Los contratos, incidentes y documentos contienen datos de ejemplo
   - No reflejan información real
   - Revisar y eliminar antes de usar en producción

4. **Acceso y Permisos**
   - Verificar que las políticas RLS estén correctamente configuradas
   - Probar acceso con cada rol antes de producción
   - Los roles están correctamente asignados en `user_roles`

5. **Archivos de Documentos**
   - Los `file_paths` en la tabla `documents` son MARCADORES
   - No existen archivos reales en storage
   - Implementar upload real de archivos antes de usar en producción

### ✅ RECOMENDACIONES

- **Rotación de credenciales:** Cambiar todas las contraseñas después de pruebas
- **Limpieza:** Ejecutar script de limpieza antes de producción
- **Auditoría:** Revisar audit_logs para verificar accesos durante pruebas
- **Backup:** Hacer backup antes de ejecutar el script de limpieza
- **Testing:** Probar cada funcionalidad con los usuarios de cada rol

---

## 📋 CHECKLIST DE PRUEBAS MANUALES

### Autenticación y Roles
- [ ] Login con superadmin (admin@sistema-rrhh.com)
- [ ] Login con admin_rrhh (admin@gmail.com)
- [ ] Verificar permisos de cada rol en la UI
- [ ] Probar que botones se ocultan según rol

### Seguridad & Higiene
- [ ] Ver lista de sectores (4 sectores visibles)
- [ ] Ver checklists (2 plantillas)
- [ ] Ver inspecciones (3 inspecciones con estados diferentes)
- [ ] Ver evaluaciones de área (2 evaluaciones)
- [ ] Iniciar nueva inspección desde checklist
- [ ] Registrar mantenimiento de equipo

### Inventario
- [ ] Ver lista de items (9 items)
- [ ] Verificar stock crítico (Calzado: 4 < 8)
- [ ] Ver asignaciones activas (2 cascos a María)
- [ ] Ver historial de movimientos (5 movimientos)
- [ ] Asignar nuevo item
- [ ] Devolver item asignado

### RRHH
- [ ] Ver contratos activos (2 contratos)
- [ ] Ver solicitudes de vacaciones (3 solicitudes)
- [ ] Aprobar/rechazar solicitud pendiente
- [ ] Ver balances de vacaciones (2 usuarios)

### Incidentes
- [ ] Ver lista de incidentes (4 incidentes)
- [ ] Filtrar por estado (1 abierto, 1 en_progreso, 1 resuelto, 1 cerrado)
- [ ] Ver detalle de incidente
- [ ] Actualizar estado de incidente abierto

### Documentos
- [ ] Ver lista de documentos (3 documentos)
- [ ] Filtrar públicos (2 documentos)
- [ ] Filtrar privados (1 documento)
- [ ] Verificar que file_paths son marcadores

---

## 📊 ESTADÍSTICAS FINALES

```
Total de tablas con datos: 14
Total de registros insertados: ~52
Usuarios con roles asignados: 2
Usuarios pendientes: 4
Relaciones creadas: ✅ Todas coherentes
Idempotencia: ✅ Implementada (ON CONFLICT DO NOTHING)
```

---

## 🔗 RELACIONES IMPLEMENTADAS

```
profiles → user_roles (user_id)
profiles → contracts (user_id)
profiles → vacation_requests (user_id)
profiles → incidents (reported_by, assigned_to)
profiles → sh_sectors (responsible_id)
profiles → sh_inspections (inspector_id)
profiles → inventory_assignments (user_id)

sh_sectors → sh_inspections (sector_id)
sh_sectors → sh_area_evaluations (sector_id)

inventory_items → inventory_maintenance (item_id)
inventory_items → inventory_assignments (item_id)
inventory_items → inventory_movements (item_id)
```

---

## 📞 SOPORTE

Para cualquier problema con los datos de muestra:
1. Revisar las queries de verificación
2. Ejecutar el script de limpieza si es necesario
3. Re-ejecutar los inserts (son idempotentes)
4. Verificar políticas RLS si no ves datos

---

**Generado automáticamente por el sistema de seed data**  
**Versión:** 1.0  
**Fecha:** 2025-11-16
