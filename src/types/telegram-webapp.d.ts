declare module '@twa-dev/sdk' {
    interface WebApp {
        isInitialized: boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe: {
            user?: {
                id: number;
                first_name: string;
                last_name?: string;
                username?: string;
            };
        };
        colorScheme: string;
    }

    const WebApp: WebApp;
    export default WebApp;
} 