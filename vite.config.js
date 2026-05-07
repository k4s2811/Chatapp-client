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

        proxy: {

            // SOCKET.IO
            "/socket.io": {
                target: "http://localhost:3002",
                ws: true,
                changeOrigin: true,
            },

            // USER SERVICE
            "/user": {
                target: "http://localhost:3001/chat",
                changeOrigin: true,
            },

            // CHAT SERVICE
            "/conversations": {
                target: "http://localhost:3002/chat",
                changeOrigin: true,
            },
            "/messages": {
                target: "http://localhost:3002/chat",
                changeOrigin: true,
            },
        },
    },
});