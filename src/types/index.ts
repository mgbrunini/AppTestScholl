export interface User {
    pk_usuario: string;
    dni: string; // Alias for pk_usuario for frontend consistency
    nombre: string;
    apellido: string;
    email: string;
    fk_colegio: string;
    rol: string;
}

export interface ApiResponse<T = any> {
    ok: boolean;
    msg?: string;
    data?: T;
    [key: string]: any;
}

export interface LoginResponse extends ApiResponse {
    token?: string;
    user?: User;
}

export interface College {
    pk_colegio: string;
    nombre: string;
    direccion?: string;
    rol?: string; // Role specific to this college
}

export interface DashboardResponse extends ApiResponse {
    user?: User;
    colegio?: College;
    colleges?: College[];
    extras?: any;
}
