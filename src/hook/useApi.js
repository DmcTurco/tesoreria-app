import { useMemo } from 'react';
import apiService from '../services/api';

function useApi() {
    const api = useMemo(() => {
        return {
            get: async (url, options = {}) => {
                try {
                    // Si hay parámetros, construir la URL con query string
                    let finalUrl = url;
                    if (options.params) {
                        const searchParams = new URLSearchParams();

                        // Agregar cada parámetro al query string
                        Object.entries(options.params).forEach(([key, value]) => {
                            if (value !== null && value !== undefined) {
                                searchParams.append(key, value.toString());
                            }
                        });

                        const queryString = searchParams.toString();
                        if (queryString) {
                            finalUrl = `${url}?${queryString}`;
                        }

                        // console.log('📤 Final URL with params:', finalUrl);
                        // console.log('📋 Query params:', Object.fromEntries(searchParams));
                    }

                    // Crear opciones sin los params (para evitar conflictos)
                    const { params, ...restOptions } = options;

                    return await apiService.get(finalUrl, restOptions);
                } catch (error) {
                    console.error('Error en la petición GET:', error);
                    throw error;
                }
            },

            post: async (url, body, options = {}) => {
                try {
                    return await apiService.post(url, body, options);
                } catch (err) {
                    console.error('Error en POST:', err);
                    throw err;
                }
            },

            // ✅ AGREGADO: Método PUT
            put: async (url, body, options = {}) => {
                try {
                    return await apiService.put(url, body, options);
                } catch (err) {
                    console.error('Error en PUT:', err);
                    throw err;
                }
            },

            // ✅ AGREGADO: Método DELETE
            delete: async (url, body = null, options = {}) => {
                try {
                    return await apiService.delete(url, body, options);
                } catch (err) {
                    console.error('Error en DELETE:', err);
                    throw err;
                }
            },
        };
    }, []);

    return api;
}

export default useApi;