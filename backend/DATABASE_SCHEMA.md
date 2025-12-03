# EscuelApp - Diagrama Entidad-Relación (ERD)

## Diagrama de Relaciones

```mermaid
erDiagram
    Usuarios ||--o{ Personal_Colegios : "trabaja_en"
    Colegios ||--o{ Personal_Colegios : "tiene_personal"
    Colegios ||--o{ Materias : "ofrece"
    Colegios ||--o{ Alumnos : "inscribe"
    Colegios ||--o{ Inscripciones : "gestiona"
    Colegios ||--o{ CalendarioCalificaciones : "configura"
    Usuarios ||--o{ Materias : "imparte"
    Usuarios ||--o{ CalendarioCalificaciones : "crea"
    Usuarios ||--o{ Notificaciones : "recibe"
    Usuarios ||--o{ ConfiguracionUI : "personaliza"
    Alumnos ||--o{ Inscripciones : "se_inscribe"
    Materias ||--o{ Inscripciones : "tiene_inscriptos"
    
    Usuarios {
        string pk_usuario PK "DNI"
        string nombre
        string apellido
        string email UK
        date fecha_nacimiento
        string domicilio
        string partido
        string localidad
        string rol "Padre,Docente,Directivo,Preceptor,Admin"
        string password "Hasheada"
        string fk_colegio "LEGACY - usar Personal_Colegios"
        boolean activo
    }
    
    Colegios {
        int pk_colegio PK "AUTO_INCREMENT"
        string tipo "Secundaria,Secundaria Agraria"
        string nombre
        string direccion
        string partido
        string localidad
        string cue UK
        string telefono
        string email
        boolean activo
        string approval_token
    }
    
    Personal_Colegios {
        int pk_personal_colegio PK "AUTO_INCREMENT"
        string fk_usuario FK
        int fk_colegio FK
        string roles "CSV: Docente,Preceptor"
        boolean activo
    }
    
    Materias {
        string pk_materia PK "UUID"
        int fk_colegio FK
        string nombre
        string curso "PRIMERO A, SEGUNDO B"
        string fk_docente FK
        text horario "JSON"
        boolean activo
        string tipo_asignacion "Titular,Suplente,Temporal"
        date fecha_inicio
        date fecha_fin
        string fk_docente_titular_dni
        string fk_docente_titular_nombre
    }
    
    Alumnos {
        string pk_alumno PK "DNI"
        string dni
        string nombre
        string apellido
        date fecha_nacimiento
        int fk_colegio FK
        string curso "PRIMERO,SEGUNDO,QUINTO"
        string division "A,B"
        string condicion "CURSA,RECURSA,INTENSIFICA"
        boolean activo
    }
    
    Inscripciones {
        string pk_inscripcion PK "UUID"
        string fk_alumno FK
        string fk_materia FK
        int fk_colegio FK
        int year "Año lectivo"
        string condicion "CURSA,RECURSA,INTENSIFICA"
        datetime fecha_inscripcion
        boolean activo
    }
    
    CalendarioCalificaciones {
        int pk_calendario PK "AUTO_INCREMENT"
        int fk_colegio FK
        date fecha_inicio
        date fecha_fin
        string descripcion "1er Trimestre"
        string creado_por FK
        datetime fecha_creacion
        boolean activo
    }
    
    Notificaciones {
        int pk_notificacion PK "AUTO_INCREMENT"
        string fk_usuario FK
        string tipo "CALENDARIO,MATERIA,GENERAL,SISTEMA"
        text mensaje
        datetime fecha
        boolean leida
        string fk_referencia "ID opcional"
    }
    
    ConfiguracionUI {
        string fk_usuario PK_FK
        text iconos_visibles "JSON array"
        text orden_iconos "JSON array"
        datetime fecha_actualizacion
    }
    
    Acciones {
        datetime timestamp
        text accion
    }
```

---

## Tablas del Sistema

### 1. **Usuarios**
**Descripción**: Almacena todos los usuarios del sistema (padres, docentes, directivos, preceptores, administradores).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_usuario` | VARCHAR(20) PK | DNI del usuario |
| `nombre` | VARCHAR(100) | Nombre del usuario |
| `apellido` | VARCHAR(100) | Apellido del usuario |
| `email` | VARCHAR(255) UNIQUE | Email único |
| `fecha_nacimiento` | DATE | Fecha de nacimiento |
| `domicilio` | VARCHAR(255) | Dirección completa |
| `partido` | VARCHAR(100) | Partido (Buenos Aires) |
| `localidad` | VARCHAR(100) | Localidad |
| `rol` | ENUM | Padre, Docente, Directivo, Preceptor, Admin |
| `password` | VARCHAR(255) | Contraseña hasheada con salt |
| `fk_colegio` | VARCHAR(50) | **LEGACY** - Ahora usar Personal_Colegios |
| `activo` | BOOLEAN | Estado del usuario |

**Relaciones**:
- 1:N con `Personal_Colegios` (un usuario puede trabajar en varios colegios)
- 1:N con `Materias` (un docente puede impartir varias materias)
- 1:N con `CalendarioCalificaciones` (un usuario crea períodos de calificación)
- 1:N con `Notificaciones` (un usuario recibe notificaciones)
- 1:1 con `ConfiguracionUI` (personalización de interfaz)

---

### 2. **Colegios**
**Descripción**: Instituciones educativas registradas en el sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_colegio` | INT PK AUTO_INCREMENT | ID único del colegio |
| `tipo` | ENUM | Secundaria, Secundaria Agraria |
| `nombre` | VARCHAR(255) | Nombre del colegio |
| `direccion` | VARCHAR(255) | Dirección física |
| `partido` | VARCHAR(100) | Partido |
| `localidad` | VARCHAR(100) | Localidad |
| `cue` | VARCHAR(20) UNIQUE | Clave Única de Establecimiento |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `email` | VARCHAR(255) | Email institucional |
| `activo` | BOOLEAN | Estado del colegio |
| `approval_token` | VARCHAR(255) | Token de aprobación |

**Relaciones**:
- 1:N con `Personal_Colegios` (tiene personal)
- 1:N con `Materias` (ofrece materias)
- 1:N con `Alumnos` (inscribe alumnos)
- 1:N con `Inscripciones` (gestiona inscripciones)
- 1:N con `CalendarioCalificaciones` (configura períodos)

---

### 3. **Personal_Colegios**
**Descripción**: Relación muchos a muchos entre usuarios y colegios. Permite que un usuario trabaje en múltiples colegios con diferentes roles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_personal_colegio` | INT PK AUTO_INCREMENT | ID único |
| `fk_usuario` | VARCHAR(20) FK | DNI del usuario |
| `fk_colegio` | INT FK | ID del colegio |
| `roles` | VARCHAR(255) | CSV: "Docente,Preceptor" |
| `activo` | BOOLEAN | Estado de la relación |

**Relaciones**:
- N:1 con `Usuarios`
- N:1 con `Colegios`

---

### 4. **Materias**
**Descripción**: Asignaturas ofrecidas por cada colegio, con asignación de docentes (titular, suplente o temporal).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_materia` | VARCHAR(50) PK | UUID generado |
| `fk_colegio` | INT FK | ID del colegio |
| `nombre` | VARCHAR(100) | Nombre de la materia |
| `curso` | VARCHAR(20) | Ej: "PRIMERO A", "SEGUNDO B" |
| `fk_docente` | VARCHAR(20) FK | DNI del docente actual |
| `horario` | TEXT | JSON con horarios |
| `activo` | BOOLEAN | Estado de la materia |
| `tipo_asignacion` | ENUM | Titular, Suplente, Temporal |
| `fecha_inicio` | DATE | Inicio de asignación temporal |
| `fecha_fin` | DATE | Fin de asignación temporal |
| `fk_docente_titular_dni` | VARCHAR(20) | DNI del titular (si es suplencia) |
| `fk_docente_titular_nombre` | VARCHAR(200) | Nombre del titular (denormalizado) |

**Relaciones**:
- N:1 con `Colegios`
- N:1 con `Usuarios` (docente)
- 1:N con `Inscripciones`

> **⚠️ IMPORTANTE**: Cuando `tipo_asignacion` es "Suplente" o "Temporal", se debe verificar automáticamente si `fecha_fin` ha pasado para restaurar al docente titular.

---

### 5. **Alumnos**
**Descripción**: Información específica de los estudiantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_alumno` | VARCHAR(20) PK | DNI del alumno |
| `dni` | VARCHAR(20) | DNI (duplicado para consistencia) |
| `nombre` | VARCHAR(100) | Nombre |
| `apellido` | VARCHAR(100) | Apellido |
| `fecha_nacimiento` | DATE | Fecha de nacimiento |
| `fk_colegio` | INT FK | ID del colegio |
| `curso` | VARCHAR(20) | PRIMERO, SEGUNDO, QUINTO |
| `division` | VARCHAR(10) | A, B |
| `condicion` | ENUM | CURSA, RECURSA, INTENSIFICA |
| `activo` | BOOLEAN | Estado del alumno |

**Relaciones**:
- N:1 con `Colegios`
- 1:N con `Inscripciones`

---

### 6. **Inscripciones** ✨ **ACTUALIZADA**
**Descripción**: Relación muchos a muchos entre alumnos y materias. Permite gestionar qué materias cursa cada alumno y en qué condición.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_inscripcion` | VARCHAR(50) PK | UUID |
| `fk_alumno` | VARCHAR(20) FK | DNI del alumno |
| `fk_materia` | VARCHAR(50) FK | ID de la materia |
| `fk_colegio` | INT FK | **NUEVO** - ID del colegio |
| `year` | INT | **NUEVO** - Año lectivo (2024, 2025) |
| `condicion` | ENUM | CURSA, RECURSA, INTENSIFICA |
| `fecha_inscripcion` | DATETIME | Timestamp de inscripción |
| `activo` | BOOLEAN | Estado de la inscripción |

**Relaciones**:
- N:1 con `Alumnos`
- N:1 con `Materias`
- N:1 con `Colegios`

**Lógica de negocio**:
- Cuando se da de alta un alumno con condición "CURSA", se debe crear automáticamente una inscripción para **todas las materias** de su curso/división.
- Para alumnos con condición "RECURSA" o "INTENSIFICA", las inscripciones se gestionan manualmente.

---

### 7. **CalendarioCalificaciones**
**Descripción**: Períodos de calificación configurables por colegio (trimestres, cuatrimestres, etc.).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_calendario` | INT PK AUTO_INCREMENT | ID único |
| `fk_colegio` | INT FK | ID del colegio |
| `fecha_inicio` | DATE | Inicio del período |
| `fecha_fin` | DATE | Fin del período |
| `descripcion` | VARCHAR(100) | "1er Trimestre", "2do Cuatrimestre" |
| `creado_por` | VARCHAR(20) FK | DNI del usuario creador |
| `fecha_creacion` | DATETIME | Timestamp de creación |
| `activo` | BOOLEAN | Estado del período |

**Relaciones**:
- N:1 con `Colegios`
- N:1 con `Usuarios` (creador)

---

### 8. **Notificaciones**
**Descripción**: Sistema de notificaciones push para usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pk_notificacion` | INT PK AUTO_INCREMENT | ID único |
| `fk_usuario` | VARCHAR(20) FK | DNI del destinatario |
| `tipo` | ENUM | CALENDARIO, MATERIA, GENERAL, SISTEMA |
| `mensaje` | TEXT | Contenido de la notificación |
| `fecha` | DATETIME | Timestamp |
| `leida` | BOOLEAN | Estado de lectura |
| `fk_referencia` | VARCHAR(50) | ID del objeto relacionado (opcional) |

**Relaciones**:
- N:1 con `Usuarios`

---

### 9. **ConfiguracionUI**
**Descripción**: Configuración personalizada de interfaz por usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fk_usuario` | VARCHAR(20) PK/FK | DNI del usuario |
| `iconos_visibles` | TEXT | JSON array de iconos visibles |
| `orden_iconos` | TEXT | JSON array de índices de orden |
| `fecha_actualizacion` | DATETIME | Última actualización |

**Relaciones**:
- 1:1 con `Usuarios`

---

### 10. **Acciones**
**Descripción**: Log de auditoría simple para registrar acciones del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | DATETIME | Momento de la acción |
| `accion` | TEXT | Descripción de la acción |

**Uso**: Esta tabla se utiliza para logging básico de eventos del sistema. Es una tabla de auditoría sin relaciones directas.

---

## Índices Recomendados (para migración futura)

```sql
-- Usuarios
CREATE INDEX idx_usuarios_email ON Usuarios(email);
CREATE INDEX idx_usuarios_rol ON Usuarios(rol);

-- Personal_Colegios
CREATE INDEX idx_personal_usuario ON Personal_Colegios(fk_usuario);
CREATE INDEX idx_personal_colegio ON Personal_Colegios(fk_colegio);

-- Materias
CREATE INDEX idx_materias_colegio ON Materias(fk_colegio);
CREATE INDEX idx_materias_docente ON Materias(fk_docente);
CREATE INDEX idx_materias_curso ON Materias(curso);

-- Alumnos
CREATE INDEX idx_alumnos_colegio ON Alumnos(fk_colegio);
CREATE INDEX idx_alumnos_curso_division ON Alumnos(curso, division);

-- Inscripciones
CREATE INDEX idx_inscripciones_alumno ON Inscripciones(fk_alumno);
CREATE INDEX idx_inscripciones_materia ON Inscripciones(fk_materia);
CREATE INDEX idx_inscripciones_colegio_year ON Inscripciones(fk_colegio, year);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario ON Notificaciones(fk_usuario);
CREATE INDEX idx_notificaciones_leida ON Notificaciones(leida);
```

---

## Cambios Recientes

### 2025-12-03: Actualización de Inscripciones
- ✅ Agregado campo `fk_colegio` para soporte multi-colegio
- ✅ Agregado campo `year` para histórico de años lectivos
- ✅ Actualizada documentación y comentarios

---

## Notas para Migración Futura

Cuando se migre a una base de datos relacional (MySQL, PostgreSQL):

1. **Constraints de Foreign Keys**: Implementar todas las relaciones FK con `ON DELETE CASCADE` o `ON DELETE SET NULL` según corresponda
2. **Triggers**: Crear triggers para:
   - Auto-inscripción de alumnos en materias al dar de alta
   - Verificación automática de fechas de suplencias
   - Actualización de timestamps
3. **Stored Procedures**: Migrar lógica de negocio compleja
4. **Vistas**: Crear vistas para queries comunes (ej: materias con docentes, alumnos con inscripciones)
