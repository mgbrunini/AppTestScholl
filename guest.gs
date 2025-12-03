/**
 * Devuelve la hoja "Alumnos" del spreadsheet.
 * Si el proyecto está container-bound (script dentro del spreadsheet), se usa getActiveSpreadsheet().
 * Si es standalone, reemplazar SPREADSHEET_ID por el id de tu spreadsheet.
 */
function getUsuariosSheet(){
  var SPREADSHEET_ID = 'REPLACE_WITH_SPREADSHEET_ID'; // si estás dentro del spreadsheet deja este texto así
  var ss;
  if (SPREADSHEET_ID === 'REPLACE_WITH_SPREADSHEET_ID') {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } else {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  if (!ss) throw new Error('No se pudo abrir el spreadsheet. Revisa el SPREADSHEET_ID o enlaza este script al spreadsheet.');
  var sheet = ss.getSheetByName('Alumnos');
  if (!sheet) throw new Error('No se encontró la pestaña "Alumnos" en el spreadsheet indicado.');
  return sheet;
}

/**
 * Registra una acción simple del cliente en la hoja "Acciones"
 * (timestamp, accion)
 */
function registrarAccionCliente(accion){
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      // si no está container-bound tratamos de usar el ID en getUsuariosSheet()
      var tmp = getUsuariosSheet(); // esto lanzará error si no encuentra el spreadsheet
      ss = tmp.getParent();
    }
    var logSheet = ss.getSheetByName('Acciones');
    if (!logSheet) {
      logSheet = ss.insertSheet('Acciones');
      logSheet.getRange(1,1,1,2).setValues([['Timestamp','Accion']]);
    }
    logSheet.appendRow([new Date(), accion]);
  } catch (err) {
    // No interrumpimos la app por un fallo de logging
    Logger.log('Error en registrarAccionCliente: ' + err);
  }
}

/**
 * Buscar alumno con nombre, apellido y dni.
 * - Solo ejecuta búsqueda si los 3 campos vienen no vacíos (verificación adicional server-side).
 * - Retorna objeto con estado:
 *    { ok: true/false, found: true/false, active: true/false, data: {...}, message: '...' }
 */
function buscarAlumno(nombre, apellido, dni){
  nombre = (nombre || '').toString().trim();
  apellido = (apellido || '').toString().trim();
  dni = (dni || '').toString().trim();

  // registrar intento de búsqueda
  registrarAccionCliente('Intento de búsqueda - nombre: "'+nombre+'", apellido: "'+apellido+'", dni: "'+dni+'"');

  if (!nombre || !apellido || !dni) {
    registrarAccionCliente('Búsqueda abortada por datos incompletos');
    return { ok:false, found:false, message: 'Faltan datos obligatorios (nombre, apellido, dni).' };
  }

  try {
    var sheet = getUsuariosSheet();
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues(); // incluye encabezado
    if (values.length <= 1) {
      registrarAccionCliente('Búsqueda fallida - hoja Alumnos vacía (solo encabezado o inexistente)');
      return { ok:true, found:false, message: 'No hay registros en la hoja "Alumnos".' };
    }

    // buscamos filas (empezando en la fila 2)
    var foundRow = null;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var pk_alumno = (row[0] || '').toString().trim(); // Col A - DNI
      var nombreRow = (row[1] || '').toString().trim(); // Col B
      var apellidoRow = (row[2] || '').toString().trim(); // Col C
      // comparaciones case-insensitive
      if (pk_alumno === dni && nombreRow.toLowerCase() === nombre.toLowerCase() && apellidoRow.toLowerCase() === apellido.toLowerCase()) {
        foundRow = row;
        break;
      }
    }

    if (!foundRow) {
      registrarAccionCliente('Búsqueda sin coincidencias para dni "'+dni+'" y nombre/apellido.');
      return { ok:true, found:false, message: 'No existen datos coincidentes.' };
    }

    // mapeo de columnas según tu estructura:
    // A pk_alumno (DNI)
    // B nombre
    // C apellido
    // D email
    // E rol
    // F password
    // G fk_colegio
    // H activo (booleano)
    var activoVal = foundRow[7];
    var isActive = parseActivo(activoVal);

    var resultData = {
      pk_alumno: (foundRow[0] || '').toString(),
      nombre: (foundRow[1] || '').toString(),
      apellido: (foundRow[2] || '').toString(),
      email: (foundRow[3] || '').toString(),
      rol: (foundRow[4] || '').toString(),
      // password intencionalmente NO se envía al cliente por seguridad
      fk_colegio: (foundRow[6] || '').toString(),
      activoRaw: activoVal
    };

    if (!isActive) {
      registrarAccionCliente('Alumno encontrado pero INACTIVO - dni: "'+dni+'". Acceso denegado.');
      return { ok:true, found:true, active:false, data: resultData, message: 'El alumno existe pero está INACTIVO. No puede acceder.' };
    } else {
      registrarAccionCliente('Alumno encontrado y ACTIVO - dni: "'+dni+'". Resultado devuelto al cliente.');
      return { ok:true, found:true, active:true, data: resultData, message: 'Alumno encontrado.' };
    }

  } catch (err) {
    registrarAccionCliente('Error en buscarAlumno: ' + err.toString());
    return { ok:false, found:false, message: 'Ocurrió un error en el servidor: ' + err.toString() };
  }
}

/**
 * Interpretación flexible del campo "activo".
 * Acepta boolean, "TRUE"/"FALSE", "1"/"0", 1/0, "si"/"no", etc.
 */
function parseActivo(val){
  if (val === true) return true;
  if (val === false) return false;
  if (val === null || val === undefined) return false;
  var s = ('' + val).toString().trim().toLowerCase();
  if (s === '') return false;
  if (s === 'true' || s === 't' || s === 'si' || s === 'sí' || s === '1' || s === 'y' || s === 'yes') return true;
  if (s === 'false' || s === 'f' || s === 'no' || s === '0' || s === 'n' || s === 'none') return false;
  // si no reconocemos, por seguridad lo consideramos false (inactivo)
  return false;
}
