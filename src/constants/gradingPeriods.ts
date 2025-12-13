// Tipos de períodos de evaluación
export const PERIODOS_EVALUACION = {
    // Primer Cuatrimestre
    '1RA_INTENSIFICACION': '1ª Intensificación',
    '1ER_AVANCE': '1° Avance',
    '2DA_INTENSIFICACION': '2ª Intensificación',
    '1ER_CUATRIMESTRE': 'Calificación 1er Cuatrimestre',

    // Segundo Cuatrimestre
    '3RA_INTENSIFICACION': '3ª Intensificación',
    '2DO_AVANCE': '2° Avance',
    '4TA_INTENSIFICACION': '4ª Intensificación',
    '2DO_CUATRIMESTRE': 'Calificación 2do Cuatrimestre',

    // Adicionales
    '5TA_INTENSIFICACION': '5ª Intensificación (Diciembre)',
    '6TA_INTENSIFICACION': '6ª Intensificación (Febrero)',
    'CALIFICACION_FINAL': 'Calificación Final'
} as const;

export type PeriodoEvaluacion = keyof typeof PERIODOS_EVALUACION;

// Tipos de valores de calificación
export type ValorCalificacion = string; // Numérico 1-10 o TEA/TEP/TED

// Opciones para avances
export const OPCIONES_AVANCE = ['TEA', 'TEP', 'TED'] as const;
export type OpcionAvance = typeof OPCIONES_AVANCE[number];

// Validación de aprobación
export function isAprobado(periodo: PeriodoEvaluacion, valor: string): boolean {
    // Avances: solo TEA es aprobado
    if (periodo === '1ER_AVANCE' || periodo === '2DO_AVANCE') {
        return valor === 'TEA';
    }

    // Intensificaciones 5 y 6: aprobado >= 4
    if (periodo === '5TA_INTENSIFICACION' || periodo === '6TA_INTENSIFICACION') {
        const num = parseFloat(valor);
        return !isNaN(num) && num >= 4;
    }

    // Resto: aprobado >= 7
    const num = parseFloat(valor);
    return !isNaN(num) && num >= 7;
}

// Determinar si un período acepta valores numéricos o TEA/TEP/TED
export function isNumericPeriod(periodo: PeriodoEvaluacion): boolean {
    return periodo !== '1ER_AVANCE' && periodo !== '2DO_AVANCE';
}

// Obtener rango de calificación para un período
export function getGradeRange(periodo: PeriodoEvaluacion): { min: number, max: number, approved: number } | null {
    if (!isNumericPeriod(periodo)) return null;

    if (periodo === '5TA_INTENSIFICACION' || periodo === '6TA_INTENSIFICACION') {
        return { min: 1, max: 10, approved: 4 };
    }

    if (periodo === 'CALIFICACION_FINAL') {
        return { min: 1, max: 10, approved: 7 };
    }

    return { min: 1, max: 10, approved: 7 };
}
