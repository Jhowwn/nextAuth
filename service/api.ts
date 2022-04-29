import axios, { AxiosError } from 'axios';
import Router from 'next/router';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';

let isRefreshing = false;
let failedRequestQueue = [];

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333/',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    });

    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if (error.response.status === 401) {
            if (error.response.data?.code === 'token.expired') {
                //Renovo o token
                cookies = parseCookies(ctx);

                const { 'nextauth.refreshToken': refreshToken } = cookies;
                const originalConfig = error.config;
                console.log(cookies)

                if (!isRefreshing) {
                    isRefreshing = true;

                    api.post('/refresh', {
                        refreshToken,
                    }).then(response => {
                        const { token } = response.data;
                        console.log('teste', response)

                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30,//30 dias
                            path: '/'
                        });

                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30,//30 dias
                            path: '/'
                        });

                        api.defaults.headers['Authorization'] = `Barear ${token}`;

                        failedRequestQueue.forEach(request => request.onSuccess(token));
                        failedRequestQueue = [];
                    }).catch((err) => {
                        failedRequestQueue.forEach(request => request.onFailure(err));
                        failedRequestQueue = [];

                        if (process.browser) {
                            signOut()
                        }
                    }).finally(() => {
                        isRefreshing = false;
                    })
                }

                return new Promise((resolve, reject) => {
                    failedRequestQueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Barear ${token}`;

                            resolve(api(originalConfig))
                        },
                        onFailure: (err: AxiosError) => {
                            reject(err);
                        }
                    })
                })
            } else {
                //Deslogar o usuário
                if (process.browser) {
                    signOut()
                }
            }
        }

        return Promise.resolve(error)
    })

    return api;
}