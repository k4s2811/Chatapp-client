import api from "../services/axios";

export const authApi = {

    signup: (data) => api.post("/user/signup", data),

    signin: (data) => api.post("/user/signin", data),

    signout: () => api.post("/user/signout"),

    signoutAll: () => api.post("/user/signout-all"),

    me: () => api.get("/user/me"),

    refresh: () => api.post("/user/refresh"),

    verifyEmail: (token) => api.post("/user/verify-email", { token }),

    forgotPassword: (email) => api.post("/user/forgot-password", { email }),

    resetPassword: (data) => api.post("/user/reset-password", data),

    changePassword: (data) => api.post("/user/changepassword", data),
};

export const usersApi = {

    getAllUsers: (page = 1, search = '') => api.get(`/user/allusers?page=${page}&limit=10&search=${encodeURIComponent(search)}`),

    getUsersByIds: (ids) => {
        const idsString = Array.isArray(ids) ? ids.join(',') : ids;
        return api.get("/user/usersByIds", { params: { ids: idsString } });
    },
    
    updateProfile: (data) => api.post("/user/update", data),
};