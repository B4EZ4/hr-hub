# Sistema RRHH 

## Resumen

Proyecto frontend completo para un sistema integral de Recursos Humanos (RRHH). Implementa gestión documental, contratos, módulo de Seguridad e Higiene (incluye inventario EPP, inspecciones, checklists y sectores), usuarios y roles (RBAC), vacaciones, incidencias y dashboard con widgets y acciones rápidas.

Este README contiene instrucciones técnicas para instalar, configurar, ejecutar y verificar la aplicación.

---

## Requisitos previos

* Git
* Node.js (recomendado: LTS, p. ej. 18.x o 20.x)
* npm (incluido con Node.js)
* (Opcional) nvm para gestionar versiones de Node: [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)
* Acceso a la base de datos / backend (Supabase) con credenciales de desarrollo

---

## Variables de entorno (ejemplo)

Crea un archivo `.env.local` en la raíz del proyecto e incluye, como mínimo, las variables necesarias para conectar con Supabase / backend. Ejemplo:

```env
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
REACT_APP_API_BASE_URL=http://localhost:8080
# Otras variables según la integración (storage buckets, keys de terceros, etc.)
```

> Nota: Mantén fuera del control de versiones las claves sensibles.

---

## Instalación y ejecución (desarrollo)

1. Clonar el repositorio:

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Instalar dependencias:

```sh
npm i
```

3. Iniciar servidor de desarrollo (hot-reload):

```sh
npm run dev
```

4. Abrir la aplicación en el navegador (por defecto Vite suele exponer `http://localhost:5173` o el puerto que indique la consola).

---

## Build para producción

```sh
npm run build
# luego servir el contenido de /dist con el servidor estático de tu preferencia
```

---

## Tecnologías principales

* Vite
* TypeScript
* React
* Tailwind CSS
* shadcn/ui

---

## Estructura relevante del frontend

* `src/App.tsx` — Rutas principales
* `src/components/layout/AppSidebar.tsx` — Sidebar y navegación
* `src/pages/Dashboard.tsx` — Dashboard con widgets y barra de acciones rápidas
* `src/pages/settings/Settings.tsx` — Configuración (Perfil, Seguridad, Notificaciones, Administración)
* `src/pages/documents/DocumentForm.tsx` — Formulario de documentos
* `src/pages/documents/DocumentDetail.tsx` — Vista detalle documentos
* `src/pages/contracts/ContractDetail.tsx` — Vista detalle contratos y acciones
* `src/pages/inventory/InventoryForm.tsx` — Formulario de ítem de inventario (ruta consolidada bajo S&H)
* `src/pages/inventory/InventoryAssignment.tsx` — Asignaciones de inventario
* `src/pages/inventory/InventoryDetail.tsx` — (Nuevo) Vista detalle inventario con historial
* `src/pages/safety/InspectionForm.tsx` — Formulario de inspección (multi-upload)
* `src/pages/safety/SafetyHome.tsx` — Hub de Seguridad e Higiene
* `SETUP.md`, `FRONTEND_COMPLETO.md`, `IMPLEMENTACION_COMPLETA.md` — Documentación adicional

---

## Rutas principales (para verificación rápida)

| Ruta                                  | Propósito                                      |
| ------------------------------------- | ---------------------------------------------- |
| `/dashboard`                          | Dashboard con widgets y acciones rápidas       |
| `/documentos`                         | Lista de documentos                            |
| `/documentos/new`                     | Formulario de carga de documento               |
| `/documentos/:id`                     | Detalle del documento (historial de versiones) |
| `/contratos`                          | Lista de contratos                             |
| `/contratos/new`                      | Nuevo contrato                                 |
| `/contratos/:id`                      | Detalle del contrato                           |
| `/seguridad-higiene`                  | Hub de Seguridad e Higiene                     |
| `/seguridad-higiene/inventario`       | Lista de inventario S&H                        |
| `/seguridad-higiene/inventario/new`   | Crear ítem de inventario                       |
| `/seguridad-higiene/inventario/:id`   | Detalle de ítem de inventario                  |
| `/seguridad-higiene/inspecciones`     | Lista de inspecciones                          |
| `/seguridad-higiene/inspecciones/new` | Crear inspección                               |
| `/seguridad-higiene/checklists`       | Lista de checklists                            |
| `/usuarios`                           | Gestión de usuarios                            |
| `/vacaciones`                         | Solicitudes de vacaciones                      |
| `/incidencias`                        | Incidencias                                    |
| `/settings`                           | Configuración del usuario / administración     |

---

## Principales funcionalidades implementadas

Resumen técnico de features implementadas en frontend:

* Uploads con barra de progreso y validaciones de tamaño/mimetype.
* Control de versiones de documentos (historial y nueva versión).
* Formularios completos con validaciones (contratos, documentos, inventario, inspecciones, checklists).
* Multi-upload de evidencias para inspecciones.
* Dashboard con widgets operativos y acciones rápidas (drops rápidos).
* RBAC en UI: botones y rutas ocultas/disabled según permisos (implementado con `useRoles()` hook).
* Panel de Stock Crítico en inventario con CTA de reabastecer.
* Asignación de ítems con descuento automático de stock y registro en historial.
* Modales y confirmaciones para acciones destructivas.
* Mensajes y toasts en español.

---

## Roles y permisos (UI)

Roles implementados:

* `superadmin` — Acceso total
* `admin_rrhh` — Gestión de usuarios, contratos, documentos
* `manager` — Aprobación de vacaciones
* `empleado` — Acceso básico
* `oficial_sh` — Gestión de Seguridad e Higiene
* `auditor` — Visualización de logs

Permisos clave mapeados en la UI (resumen):

* Cargar/Eliminar Documentos: `superadmin`, `admin_rrhh`
* Crear/Editar Contratos: `superadmin`, `admin_rrhh`
* Aprobar Vacaciones: `superadmin`, `admin_rrhh`, `manager`
* Crear Inspecciones: `superadmin`, `oficial_sh`
* Asignar EPP: `superadmin`, `oficial_sh`, `admin_rrhh`
* Gestionar Roles: `superadmin`

El control visual y lógico se realiza mediante `useRoles()` y propiedades como `canManageUsers`, `canManageContracts`, `canApproveVacations`, `canManageSH`, `isSuperadmin`.

---

## Cambios en la base de datos

No se realizaron cambios en el esquema de la base de datos en esta implementación. El frontend reutiliza las tablas existentes:

* `documents`
* `contracts`
* `inventory_items`
* `inventory_assignments`
* `sh_inspections`
* `sh_checklists`
* `profiles`
* `user_roles`

---

## Setup inicial — Crear superadmin

Credenciales provisionales para entorno de desarrollo:

```
Email: admin@sistema-rrhh.com
Password: Admin123!
```

SQL para asignar rol `superadmin` (ejecutar en el editor SQL del backend/Supabase):

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users
WHERE email = 'admin@sistema-rrhh.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Alternativa (si ya existe el usuario):

```sql
UPDATE public.user_roles
SET role = 'superadmin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@sistema-rrhh.com');
```

> IMPORTANTE: Cambiar la contraseña al primer inicio de sesión.

---

## Checklist de pruebas manuales (resumen técnico)

**Documentos**

1. Login como admin
2. Ir a `/documentos`
3. Verificar botón `Cargar Documento` visible (esquina superior derecha)
4. Abrir `/documentos/new`, completar campos y subir PDF
5. Comprobar progreso de upload y toast de éxito
6. Ver documento en la lista y abrir detalle
7. Subir nueva versión y comprobar historial

**Contratos**

1. Ir a `/contratos`
2. Verificar `Nuevo Contrato`
3. Abrir formulario, seleccionar empleado (buscable), completar campos y subir PDF
4. Guardar y abrir detalle
5. Probar `Renovar` (modal) y `Terminar` (confirmación)

**Seguridad e Higiene — Inventario**

1. Ir a `/seguridad-higiene` y verificar hub con 4 tarjetas
2. Abrir `Inventario S&H` y comprobar `Agregar Ítem`
3. Crear ítem con stock y stock mínimo
4. En detalle, usar `Asignar` y comprobar descuento automático y historial
5. Ver panel de Stock Crítico para ítems con stock ≤ min_stock

**Inspecciones**

1. Ir a `/seguridad-higiene/inspecciones`
2. Crear nueva inspección con sector, inspector y múltiples evidencias
3. Completar y verificar timeline y evidencias

**Dashboard**

1. Ver barra `Acciones Rápidas` y probar cada acción (redirecciones correctas)
2. Comprobar widgets clicables (contratos por vencer, solicitudes pendientes, stock crítico, inspecciones)

**Configuración**

1. Abrir `/settings`
2. Ver `Mi Perfil`, `Seguridad`, `Notificaciones` y (si aplica) `Administración`

---

## Acciones pendientes (backend / opcionales)

* Notificaciones automáticas al asignar EPP (crear en tabla `notifications` y triggers)
* Bulk restock (acción masiva desde panel stock crítico)
* Triggers para audit logs (completar audit logs)
* Refinar políticas RLS si es necesario
* Wizard de primer arranque (opcional para seed automático)

---

## Archivos modificados / creados (detallado)

* `src/App.tsx` — Rutas y navegación
* `src/components/layout/AppSidebar.tsx` — Sidebar sin módulo Inventario separado
* `src/pages/Dashboard.tsx` — Dashboard completo con widgets
* `src/pages/settings/Settings.tsx` — Tabs de configuración
* `src/pages/documents/DocumentForm.tsx` — Formulario y validaciones
* `src/pages/documents/DocumentDetail.tsx` — Historial y acciones
* `src/pages/contracts/ContractDetail.tsx` — Acciones renovar/terminar
* `src/pages/inventory/InventoryDetail.tsx` — Nuevo: detalle + historial
* `src/pages/inventory/InventoryForm.tsx` — Crear/editar ítems
* `src/pages/inventory/InventoryAssignment.tsx` — Asignaciones
* `src/pages/safety/InspectionForm.tsx` — Multi-upload de evidencias
* `src/pages/safety/SafetyHome.tsx` — Hub S&H
* `SETUP.md`, `FRONTEND_COMPLETO.md`, `IMPLEMENTACION_COMPLETA.md`

---

## Notas de seguridad y almacenamiento

* Row Level Security (RLS) habilitado en tablas críticas.
* Archivos almacenados en Supabase Storage (o el storage configurado). Las políticas de acceso deben revisarse según entorno.
* Sólo `superadmin` puede gestionar roles desde UI.

---

## Contacto / Soporte

Para soporte interno, utiliza el canal de comunicación del proyecto y adjunta logs y pasos para reproducir cualquier incidencia.

