import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({

    plugins: [
        react(),
        tailwindcss()
    ],

    server: {

        port: 5100,
        host: true,

        proxy: {

            // SOCKET.IO
            "/socket.io": {
                target: "https://chatapp-server-1-s022.onrender.com",
                ws: true,
                changeOrigin: true,
            },

            // USER SERVICE
            "/user": {
                target: "https://chatapp-server-px1c.onrender.com/chat",
                changeOrigin: true,
            },

            // CHAT SERVICE
            "/conversations": {
                target: "https://chatapp-server-1-s022.onrender.com/chat",
                changeOrigin: true,
            },
            "/messages": {
                target: "https://chatapp-server-1-s022.onrender.com/chat",
                changeOrigin: true,
            },
        },
    },
});