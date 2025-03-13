export const BACKEND_URL = 'http://localhost:8102';

export interface User {
    uid: number;
    username: string;
    email: string;
    phone: string;
    gender: number;
    avatar: string;
    status: number;
    token: string;
    createTime: Date;
    updateTime: Date;
}

export interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
}