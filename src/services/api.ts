import { LoginResponse, DashboardResponse } from '../types';

// TODO: El usuario deberá reemplazar esto con su URL de Web App publicada
export const API_URL = 'https://script.google.com/macros/s/AKfycbxgx3ASxoJnkV7-Z_ac8yknOz8_w_PNLRAWcgd97CSSyqh0988dpwwfQpAZ_9rpjghdaQ/exec';

import OfflineService from './OfflineService';

export const api = {
    async post(action: string, payload: any = {}): Promise<any> {
        // Generate a cache key based on action and payload
        // We exclude 'token' sometimes or just hash the whole thing? 
        // Simple key: action + JSON.stringify(payload) (careful with large payloads)
        const cacheKey = `${action}_${JSON.stringify(payload)}`;

        if (!OfflineService.getIsConnected()) {
            console.log(`[API] Offline mode detected. Checking cache for ${action}`);
            const cachedData = await OfflineService.getCachedResponse(cacheKey);
            if (cachedData) {
                return cachedData;
            }
            // If offline and no cache, returns specific error or empty?
            // User saw "Error de conexion", we probably want to suppress it if we return cached data.
            // But if no cache, we still return error.
            return { ok: false, msg: `Modo Offline: No hay datos guardados para: ${action}.` };
        }

        console.log(`[API] Enviando POST a ${action}`, payload);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ action, ...payload }),
            });

            const text = await response.text();
            console.log(`[API] Respuesta cruda de ${action}:`, text);

            try {
                const data = JSON.parse(text);
                // Cache successful responses for read operations
                if (data && (data.ok || Array.isArray(data))) {
                    // We cache everything that looks successful?
                    // Be careful with large data, but for this app it seems fine.
                    OfflineService.saveCachedResponse(cacheKey, data);
                }
                return data;
            } catch (e) {
                console.error('[API] Error al parsear JSON:', e);
                return { ok: false, msg: 'Error de formato en respuesta del servidor (posible error de Apps Script)' };
            }
        } catch (error) {
            console.error('[API] Error de red:', error);
            // If network fails (timeout, etc) but we thought we were online, try cache as fallback?
            const cachedData = await OfflineService.getCachedResponse(cacheKey);
            if (cachedData) {
                console.log(`[API] Network failed, using fallback cache for ${action}`);
                return cachedData;
            }
            return { ok: false, msg: 'Error de conexión con el servidor' };
        }
    },

    async login(user: string, pass: string): Promise<LoginResponse> {
        return this.post('login', { user, pass });
    },

    async getDashboard(token: string): Promise<DashboardResponse> {
        return this.post('getDashboard', { token });
    },

    async logout(token: string): Promise<any> {
        return this.post('logout', { token });
    },

    async getMateriasDocente(token: string, collegeId?: string): Promise<any> {
        return this.post('getProfesorMaterias', { token, collegeId });
    },

    async getMateriasJefe(token: string): Promise<any> {
        return this.post('getMateriasDepartamento', { token });
    },

    async getAlumnosMateria(curso: string, materia: string, collegeId: string, year?: number, token?: string): Promise<any> {
        const payload: any = { curso, materia, collegeId, year };
        if (token) payload.token = token;
        return this.post('getAlumnosMateria', payload);
    },

    async saveCalificacion(token: string, data: any): Promise<any> {
        if (!OfflineService.getIsConnected()) {
            await OfflineService.addToQueue('saveCalificacion', { token, ...data });
            return { ok: true, offline: true, msg: 'Saved offline' };
        }
        return this.post('saveCalificacion', { token, ...data });
    },

    async buscarAlumno(nombre: string, apellido: string, dni: string): Promise<any> {
        return this.post('buscarAlumno', { nombre, apellido, dni });
    },

    async searchAlumno(apellido: string, dni: string): Promise<any> {
        return this.post('buscarAlumno', { apellido, dni });
    },

    async getMyProfile(token: string): Promise<any> {
        return this.post('getMyProfile', { token });
    },

    async updateUserProfile(token: string, data: any): Promise<any> {
        return this.post('updateUserProfile', { token, ...data });
    },

    async updateUserPassword(token: string, currentPass: string, newPass: string): Promise<any> {
        return this.post('updateUserPassword', { token, currentPass, newPass });
    },

    async changePassword(token: string, currentPass: string, newPass: string): Promise<any> {
        return this.post('updateUserPassword', { token, currentPass, newPass });
    },

    async getMateriasDepartamento(token: string): Promise<any> {
        return this.post('getMateriasDepartamento', { token });
    },

    async getCalificacionesReport(token: string, year: string, tab: string): Promise<any> {
        return this.post('getCalificacionesReport', { token, year, tab });
    },

    async register(data: any): Promise<any> {
        return this.post('registerUser', { data });
    },

    async registerCollege(data: any): Promise<any> {
        return this.post('registerCollege', { data });
    },

    async checkDni(dni: string): Promise<any> {
        return this.post('checkDni', { dni });
    },

    async checkEmail(email: string): Promise<any> {
        return this.post('checkEmail', { email });
    },

    async requestPasswordReset(dni: string): Promise<any> {
        return this.post('requestPasswordReset', { dni });
    },

    async verifyResetCode(dni: string, code: string): Promise<any> {
        return this.post('verifyResetCode', { dni, code });
    },

    async resetPassword(dni: string, code: string, newPassword: string): Promise<any> {
        return this.post('resetPassword', { dni, code, newPassword });
    },

    async searchUserByDNI(dni: string, collegeId?: string): Promise<any> {
        return this.post('searchUserByDNI', { dni, collegeId });
    },

    async linkUserToCollege(dni: string, collegeId: string, roles: string): Promise<any> {
        return this.post('linkUserToCollege', { dni, collegeId, roles });
    },

    async sendInvitation(email: string, collegeName: string): Promise<any> {
        return this.post('sendInvitationEmail', { email, collegeName });
    },

    // Subject Management
    async getSubjects(collegeId: string): Promise<any> {
        return this.post('getSubjects', { collegeId });
    },

    async createSubject(data: { collegeId: string, nombre: string, curso: string, docenteId?: string, horario?: string }): Promise<any> {
        return this.post('createSubject', data);
    },

    async updateCollegeStaffRole(collegeId: string, userId: string, roles: string): Promise<any> {
        return this.post('updateCollegeStaffRole', { collegeId, userId, roles });
    },

    async getCollegeStaff(collegeId: string): Promise<any> {
        return this.post('getCollegeStaff', { collegeId });
    },

    async deleteCollegeStaff(collegeId: string, dni: string): Promise<any> {
        return this.post('deleteCollegeStaff', { collegeId, dni });
    },

    // Enhanced Subject-Teacher Assignment
    async updateSubjectTeacher(data: {
        subjectId: string,
        teacherDni: string,
        assignmentType: 'Titular' | 'Provisional' | 'Suplente',
        startDate?: string,
        endDate?: string
    }): Promise<any> {
        return this.post('updateSubjectTeacher', data);
    },

    async getSubjectDetail(subjectId: string): Promise<any> {
        return this.post('getSubjectDetail', { subjectId });
    },

    async getSubjectAssignmentHistory(subjectId: string): Promise<any> {
        return this.post('getSubjectAssignmentHistory', { subjectId });
    },

    // Student Management
    async createStudent(data: {
        dni: string,
        nombre: string,
        apellido: string,
        email?: string,
        fechaNacimiento?: string,
        domicilio?: string,
        partido?: string,
        localidad?: string,
        collegeId: string,
        fkPadre?: string
    }): Promise<any> {
        return this.post('createStudent', data);
    },

    async getStudents(collegeId: string, curso?: string, division?: string): Promise<any> {
        return this.post('getStudents', { collegeId, curso, division });
    },

    async getStudentDetail(studentId: string): Promise<any> {
        return this.post('getStudentDetail', { studentId });
    },

    async updateStudent(studentId: string, data: any): Promise<any> {
        return this.post('updateStudent', { studentId: studentId || null, ...data });
    },

    async deleteStudent(studentId: string, dni?: string): Promise<any> {
        return this.post('deleteStudent', { studentId: studentId || null, dni });
    },

    // Enrollment Management
    async enrollStudentInSubjects(studentDni: string, anio: string, collegeId: string): Promise<any> {
        return this.post('enrollStudentInSubjects', { studentDni, anio, collegeId });
    },

    async addStudentSubject(studentDni: string, subjectId: string, condicion: string): Promise<any> {
        return this.post('addStudentSubject', { studentId: studentDni, subjectId, condicion });
    },

    async enrollStudentsInNewSubject(subjectId: string, curso: string, collegeId: string): Promise<any> {
        return this.post('enrollStudentsInNewSubject', { subjectId, curso, collegeId });
    },

    async removeStudentSubject(studentDni: string, subjectId: string): Promise<any> {
        return this.post('removeStudentSubject', { studentId: studentDni, subjectId });
    },

    async getStudentSubjects(studentDni: string): Promise<any> {
        return this.post('getStudentSubjects', { studentId: studentDni });
    },

    async getSubjectStudents(subjectId: string): Promise<any> {
        return this.post('getSubjectStudents', { subjectId });
    },

    // Teacher Dashboard
    async getTeacherSubjects(teacherDni: string, collegeId: string): Promise<any> {
        return this.post('getTeacherSubjects', { teacherDni, collegeId });
    },

    // Calendar System
    async createCalendarPeriod(data: any): Promise<any> {
        return this.post('createCalendarPeriod', data);
    },

    async getCalendarPeriods(collegeId: string): Promise<any> {
        return this.post('getCalendarPeriods', { collegeId });
    },

    async updateCalendarPeriod(calendarId: string, data: any): Promise<any> {
        return this.post('updateCalendarPeriod', { calendarId, ...data });
    },

    async deleteCalendarPeriod(calendarId: string): Promise<any> {
        return this.post('deleteCalendarPeriod', { calendarId });
    },

    // Notifications System
    async getNotifications(dni: string): Promise<any> {
        return this.post('getNotifications', { dni });
    },

    async markNotificationAsRead(notificationId: string): Promise<any> {
        return this.post('markNotificationAsRead', { notificationId });
    },

    async getUnreadCount(dni: string): Promise<any> {
        return this.post('getUnreadCount', { dni });
    },

    async updatePushToken(dni: string, pushToken: string, token: string): Promise<any> {
        return this.post('updatePushToken', { dni, pushToken, token });
    },

    // Logging System
    async logActivity(data: {
        token?: string,
        userId?: string,
        pantalla: string,
        accion: string,
        detalles?: any,
        dispositivo?: string
    }): Promise<any> {
        return this.post('logActivity', data);
    },

    // UI Configuration
    async getUserUIConfig(dni: string): Promise<any> {
        return this.post('getUserUIConfig', { dni });
    },

    async updateUserUIConfig(dni: string, config: any): Promise<any> {
        return this.post('updateUserUIConfig', { dni, config });
    },

    // Grading System
    async saveGrade(data: {
        token: string,
        inscripcionId: string,
        alumnoId: string,
        materiaId: string,
        collegeId: string,
        year: number,
        periodo: string,
        valor: string,
        observaciones?: string
    }): Promise<any> {
        // Intercept for offline handling
        if (!OfflineService.getIsConnected()) {
            await OfflineService.addToQueue('saveCalificacion', data);
            return { ok: true, offline: true, msg: 'Saved offline' };
        }
        return this.post('saveCalificacion', data);
    },

    async getStudentGrades(alumnoId: string, materiaId: string, year: number): Promise<any> {
        return this.post('getCalificacionesAlumno', { alumnoId, materiaId, year });
    },

    async getSubjectGrades(materiaId: string, periodo: string, year: number, token?: string): Promise<any> {
        const payload: any = { materiaId, periodo, year };
        if (token) payload.token = token;
        return this.post('getCalificacionesMateria', payload);
    },

    async getStudentSubjectGrades(studentId: string, materiaId: string, year: number): Promise<any> {
        return this.post('getStudentSubjectGrades', { studentId, materiaId, year });
    }
};
