
function getSubjectStudents(subjectId) {
    try {
        if (!subjectId) return { ok: false, msg: 'Falta ID de materia' };

        var ss = SpreadsheetApp.openById(SHEET_ID);

        // 1. Buscar inscripciones activas para esta materia
        var inscripcionesSheet = ss.getSheetByName('Inscripciones');
        if (!inscripcionesSheet) {
            return { ok: true, students: [] };
        }

        var inscripcionesData = inscripcionesSheet.getDataRange().getValues();
        var alumnosMap = {}; // Map DNI -> Inscripcion Info

        // ESTRUCTURA INSCRIPCIONES: A=pk_inscripcion, B=fk_alumno, C=fk_materia, 
        // D=fk_colegio, E=year, F=condicion, G=fecha_inscripcion, H=activo
        for (var i = 1; i < inscripcionesData.length; i++) {
            var row = inscripcionesData[i];
            // Col C (2) = fk_materia, Col H (7) = activo
            if (String(row[2]) === String(subjectId) && row[7] === true) {
                var dni = String(row[1]);
                alumnosMap[dni] = {
                    pk_inscripcion: row[0],
                    condicion: row[5]
                };
            }
        }

        var dnis = Object.keys(alumnosMap);
        if (dnis.length === 0) {
            return { ok: true, students: [] };
        }

        // 2. Obtener datos completos de los alumnos
        var alumnosSheet = ss.getSheetByName('Alumnos');
        if (!alumnosSheet) {
            return { ok: false, msg: 'Hoja de Alumnos no encontrada' };
        }

        var alumnosData = alumnosSheet.getDataRange().getValues();
        var students = [];

        // ESTRUCTURA ALUMNOS: A=pk_alumno, B=dni, C=nombre, D=apellido, 
        // E=fecha_nacimiento, F=fk_colegio, G=curso, H=division, I=condicion, J=activo
        for (var i = 1; i < alumnosData.length; i++) {
            var row = alumnosData[i];
            var alumnoDni = String(row[0]); // Col A = pk_alumno (DNI)

            if (alumnosMap[alumnoDni] && row[9] === true) { // Si está inscrito y activo
                var inscripcion = alumnosMap[alumnoDni];
                students.push({
                    id: alumnoDni,
                    pk_inscripcion: inscripcion.pk_inscripcion,
                    dni: String(row[1]),           // Col B
                    nombre: String(row[2] || ''),  // Col C
                    apellido: String(row[3] || ''),// Col D
                    curso: String(row[6] || ''),   // Col G
                    division: String(row[7] || ''),// Col H
                    condicion: inscripcion.condicion // Condición de la inscripción (CURSA, RECURSA, etc)
                });
            }
        }

        // Ordenar por apellido
        students.sort(function (a, b) {
            return a.apellido.localeCompare(b.apellido);
        });

        return { ok: true, students: students };

    } catch (e) {
        return { ok: false, msg: 'Error al obtener alumnos de la materia: ' + e.toString() };
    }
}
