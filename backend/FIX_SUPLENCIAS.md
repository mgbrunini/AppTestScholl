# Plan de Corrección: Bug de Suplencias Expiradas

## Problema Identificado

Cuando se asigna un profesor suplente con `fecha_inicio` y `fecha_fin`, el sistema crea un trigger automático para revertir al profesor titular cuando expire la suplencia. Sin embargo:

❌ **Bug actual**: Si el trigger falla o no se ejecuta, la suplencia queda activa indefinidamente
❌ **No hay verificación** en tiempo real cuando se consultan las materias
❌ **No hay proceso de limpieza** manual o diario

## Solución Propuesta

### 1. Verificación Automática en `getSubjects()`

Agregar lógica para verificar fechas de suplencias **cada vez** que se consultan las materias:

```javascript
// En getSubjects(), después de obtener cada materia:
if (row[7] === 'Suplente' && row[9]) { // Si es suplente y tiene fecha_fin
  var fechaFin = new Date(row[9]);
  var hoy = new Date();
  
  if (hoy > fechaFin) {
    // La suplencia expiró, revertir al titular
    revertToOriginalTeacher(row[0]); // row[0] = pk_materia
    // Actualizar datos en memoria para devolver correctamente
    row[4] = row[10]; // Restaurar docente titular
    row[7] = 'Titular';
    row[8] = '';
    row[9] = '';
  }
}
```

### 2. Función de Reversión Reutilizable

Crear función `revertToOriginalTeacher(subjectId)` que:
- Busca la materia por ID
- Restaura el docente titular desde `fk_docente_titular_dni`
- Limpia campos de suplencia
- Registra en historial

### 3. Proceso Diario de Limpieza (Opcional pero Recomendado)

Crear función `checkAllExpiredSubstitutes()` que:
- Se ejecuta diariamente (trigger time-based)
- Recorre todas las materias con `tipo_asignacion = 'Suplente'`
- Verifica fechas y revierte las expiradas
- Envía notificación al directivo

## Archivos a Modificar

### `backend/backend.txt`

1. **Modificar `getSubjects()`** (línea ~1013)
   - Agregar verificación de fechas expiradas
   
2. **Crear `revertToOriginalTeacher(subjectId)`** (nueva función)
   - Lógica de reversión reutilizable
   
3. **Crear `checkAllExpiredSubstitutes()`** (nueva función)
   - Proceso diario de limpieza

### `backend/crearDB.txt`

✅ Ya está actualizada con la estructura correcta de Materias

## Prioridad

🔴 **ALTA** - Este es un bug crítico que afecta la gestión de personal docente

## Próximos Pasos

1. ✅ Actualizar `crearDB.txt` con nueva estructura de Inscripciones
2. ✅ Crear documentación ERD
3. ⏳ Implementar verificación automática en `getSubjects()`
4. ⏳ Crear función de reversión reutilizable
5. ⏳ Crear proceso diario de limpieza (opcional)
6. ⏳ Probar con datos reales
