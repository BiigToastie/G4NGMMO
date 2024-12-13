declare module '@twa-dev/sdk' {
    interface User {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
    }

    interface InitData {
        user?: User;
    }

    interface WebApp {
        ready(): Promise<void>;
        close(): void;
        initDataUnsafe: InitData;
    }

    const WebApp: WebApp;
    export default WebApp;
} 