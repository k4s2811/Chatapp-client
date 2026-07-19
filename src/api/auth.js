import api from "../services/axios";

export const authApi = {

    signup: (data) => api.post("/user/signup", data),

    signin: (data) => api.post("/user/signin", data),

    signout: () => api.post("/user/signout"),

    signoutAll: () => api.post("/user/signout-all"),

    me: () => api.get("/user/me"),

    refresh: () => api.post("/user/refresh"),

    changePassword: (data) => api.post("/user/changepassword", data),
};

export const usersApi = {

    getAllUsers: (page = 1, search = '', config = {}) =>
        api.get('/user/allusers', { params: { page, limit: 10, search }, ...config }),

    getUsersByIds: (ids) => {
        const idsString = Array.isArray(ids) ? ids.join(',') : ids;
        return api.get("/user/usersByIds", { params: { ids: idsString } });
    },
    
    updateProfile: (data) => api.post("/user/update", data),
};