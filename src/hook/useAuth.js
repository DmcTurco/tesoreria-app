// hook/useAuth.js
import { useState } from "react";

export const useAuth = () => {
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user")) ?? null;
        } catch {
            return null;
        }
    };

    const [user] = useState(getUser);
    const esTesorero = user?.role === 0;
    const esProfesora = user?.role === 1;
    const esPadre = user?.role === 2;

    return { user, esTesorero, esProfesora, esPadre };
};