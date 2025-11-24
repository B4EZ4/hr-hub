# Sistema de Control Biométrico - Guía Rápida

## 📋 Resumen

Sistema completo de control de acceso y asistencia mediante huella dactilar usando lector AS608 y ESP32, integrado con base de datos Supabase.

## 🗄️ Base de Datos

### Tablas Creadas

#### `biometric_templates`
Almacena plantillas de huellas cifradas (AES-256).
- **user_id**: Referencia al usuario (auth.users)
- **encrypted_template**: Plantilla cifrada del sensor AS608
- **device_id**: ID único del ESP32
- **status**: 'active' | 'revoked'

#### `biometric_events`
Registro completo de eventos para auditoría.
- **event_type**: 'enroll' | 'verify' | 'fail' | 'access_denied'
- **user_id**: Usuario (puede ser null si no identificado)
- **device_id**: Dispositivo que registró el evento
- **metadata**: Información adicional (confianza, puntaje, etc.)

### Row Level Security (RLS)

✅ Usuarios ven solo sus propias plantillas (metadatos)
✅ Admins y RRHH ven todas las plantillas (sin campo cifrado)
✅ ESP32 solo puede INSERT usando service_role key
✅ Nadie puede leer el campo `encrypted_template` directamente

## 🔐 Seguridad

### Cifrado
- **Algoritmo**: AES-256-CBC
- **Implementación**: En ESP32 antes de transmitir
- **Clave**: 32 bytes almacenados de forma segura en ESP32

### Autenticación
- **Service Role Key**: Para inserciones desde ESP32
- **Anon Key**: Para lecturas del frontend
- ESP32 **NUNCA** puede leer plantillas, solo insertarlas

## 🌐 Frontend

### Páginas Creadas

#### `/punto-acceso`
Página aislada para marcaje de asistencia:
- ✅ Sin acceso a otros módulos del sistema
- ✅ Vista en tiempo real de eventos biométricos
- ✅ Notificaciones visuales de acceso concedido/denegado
- ✅ Actualización automática vía Supabase Realtime

#### `/usuarios/:id` (Detalle de Usuario)
Integración del componente `BiometricStatus`:
- ✅ Muestra estado de huella (registrada / pendiente)
- ✅ Botón para iniciar enrolamiento
- ✅ Historial de plantillas registradas
- ✅ Eventos biométricos recientes del usuario
- ✅ Función para revocar plantillas activas

### Componentes

#### `<BiometricStatus />`
```tsx
<BiometricStatus userId="uuid" userEmail="user@example.com" />
```

Muestra:
- Estado actual (huella registrada o pendiente)
- Botón para registrar nueva huella
- Lista de plantillas con opción de revocar
- Actividad reciente del usuario

## 🔌 Integración ESP32/AS608

### Hardware Requerido
- **ESP32**: Cualquier módulo con WiFi
- **AS608**: Sensor de huellas dactilares óptico
- **Conexión**: UART (TX/RX) entre ESP32 y AS608

### Configuración Rápida

```cpp
// Credenciales Supabase
const char* supabase_url = "https://xvnncnddfnwdonqxaqrs.supabase.co";
const char* service_role_key = "TU_SERVICE_ROLE_KEY"; // ⚠️ Mantener seguro
const char* device_id = "ESP32-001"; // ID único del dispositivo
```

### Endpoints API

**1. Registrar Plantilla**
```http
POST /rest/v1/biometric_templates
Authorization: Bearer [SERVICE_ROLE_KEY]
Content-Type: application/json

{
  "user_id": "uuid-del-usuario",
  "encrypted_template": "base64_encrypted_data",
  "device_id": "ESP32-001",
  "method": "fingerprint",
  "status": "active"
}
```

**2. Registrar Evento**
```http
POST /rest/v1/biometric_events
Authorization: Bearer [SERVICE_ROLE_KEY]
Content-Type: application/json

{
  "user_id": "uuid-del-usuario",
  "event_type": "verify",
  "device_id": "ESP32-001",
  "hash": "sha256_hash",
  "metadata": {
    "confidence": 95,
    "match_score": 200,
    "user_name": "Juan Pérez"
  }
}
```

## 📊 Flujos de Trabajo

### Flujo de Enrolamiento
```
1. Usuario solicita registro desde perfil
2. Sistema notifica al ESP32
3. ESP32 captura huella 3 veces (AS608)
4. ESP32 cifra plantilla con AES-256
5. ESP32 envía a Supabase (service_role)
6. Sistema registra evento tipo 'enroll'
7. Frontend actualiza estado automáticamente
```

### Flujo de Verificación
```
1. Usuario coloca dedo en sensor
2. AS608 busca coincidencia localmente
3. ESP32 obtiene user_id del match
4. ESP32 registra evento 'verify' en Supabase
5. Sistema registra marcaje de asistencia
6. Página /punto-acceso muestra notificación
```

## 🚀 Inicio Rápido

### 1. Verificar Base de Datos
```sql
-- Ver plantillas activas
SELECT user_id, device_id, status, created_at 
FROM biometric_templates 
WHERE status = 'active';

-- Ver eventos recientes
SELECT user_id, event_type, device_id, created_at 
FROM biometric_events 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Configurar ESP32
Ver archivo `BIOMETRIC_INTEGRATION.md` para código completo del ESP32.

### 3. Acceder a Páginas
- **Punto de acceso**: `/punto-acceso`
- **Perfil de usuario**: `/usuarios/:id`

## 📦 Estructura de Archivos

```
src/
├── pages/
│   ├── BiometricAccessPoint.tsx       # Página de marcaje
│   └── users/
│       └── UserDetail.tsx             # Detalle con estado biométrico
├── components/
│   └── users/
│       └── BiometricStatus.tsx        # Componente de estado
└── integrations/
    └── supabase/
        └── types.ts                   # Tipos auto-generados

BIOMETRIC_INTEGRATION.md               # Documentación técnica completa
BIOMETRIC_SYSTEM_README.md            # Esta guía rápida
```

## 🔍 Monitoreo y Auditoría

### Consultas Útiles

**Usuarios sin huella registrada:**
```sql
SELECT p.id, p.full_name, p.email
FROM profiles p
LEFT JOIN biometric_templates bt ON bt.user_id = p.user_id AND bt.status = 'active'
WHERE bt.id IS NULL;
```

**Eventos de hoy:**
```sql
SELECT 
  be.event_type,
  p.full_name,
  be.device_id,
  be.created_at,
  be.metadata
FROM biometric_events be
LEFT JOIN profiles p ON p.user_id = be.user_id
WHERE DATE(be.created_at) = CURRENT_DATE
ORDER BY be.created_at DESC;
```

**Dispositivos activos:**
```sql
SELECT 
  device_id,
  COUNT(*) as total_events,
  MAX(created_at) as last_event
FROM biometric_events
GROUP BY device_id
ORDER BY last_event DESC;
```

## ⚠️ Consideraciones Importantes

### Seguridad
1. **Service Role Key**: Nunca exponerla en el frontend
2. **Cifrado**: Todas las plantillas deben cifrarse antes de transmitir
3. **RLS**: Validado automáticamente en todas las operaciones
4. **Auditoría**: Todos los eventos quedan registrados

### Performance
1. **Índices**: Creados automáticamente para consultas rápidas
2. **Realtime**: Usar suscripciones para actualizaciones en vivo
3. **Cache**: Considerar cache local en ESP32 para modo offline

### Escalabilidad
1. **Múltiples dispositivos**: Soportado nativamente con `device_id`
2. **Múltiples plantillas**: Un usuario puede tener varias huellas
3. **Revocación**: Plantillas pueden revocarse sin borrar historial

## 📚 Documentación Adicional

- **`BIOMETRIC_INTEGRATION.md`**: Guía técnica completa para ESP32
- **Comentarios en DB**: Cada tabla y campo tiene documentación en PostgreSQL
- **Código ESP32**: Ejemplos completos de enrolamiento y verificación

## 🛠️ Troubleshooting

**Problema: Usuario no aparece en eventos**
- ✅ Verificar que user_id sea correcto
- ✅ Comprobar que plantilla esté activa
- ✅ Revisar RLS policies

**Problema: ESP32 no puede insertar**
- ✅ Verificar service_role_key
- ✅ Comprobar conectividad WiFi
- ✅ Validar formato JSON del payload

**Problema: Frontend no actualiza**
- ✅ Verificar suscripción a canal Realtime
- ✅ Comprobar permisos RLS para SELECT
- ✅ Revisar console para errores

## 📞 Soporte

Para más detalles técnicos, consultar:
1. `BIOMETRIC_INTEGRATION.md` - Documentación técnica completa
2. Comentarios en las tablas de la base de datos
3. Código fuente de componentes React

---

**Versión**: 1.0  
**Última actualización**: 2025-01-15  
**Estado**: Producción
