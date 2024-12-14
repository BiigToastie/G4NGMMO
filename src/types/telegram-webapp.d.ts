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
        expand(): void;
        enableClosingConfirmation(): void;
        disableClosingConfirmation(): void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        initData: string;
        initDataUnsafe: InitData;
        colorScheme: 'light' | 'dark';
        themeParams: {
            bg_color: string;
            text_color: string;
            hint_color: string;
            link_color: string;
            button_color: string;
            button_text_color: string;
        };
        platform: string;
        version: string;
    }

    const WebApp: WebApp;
    export default WebApp;
} 