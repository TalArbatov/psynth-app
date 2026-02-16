export const config = {
    port: parseInt(process.env.PORT || '4000', 10),
    clientDir: process.env.CLIENT_DIR || '../client/dist',
} as const;
