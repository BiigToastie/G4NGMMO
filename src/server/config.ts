import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Lade Umgebungsvariablen aus .env Datei
dotenvConfig({ path: resolve(__dirname, '../../.env') });

interface Config {
    mongoUri: string;
    dbName: string;
    port: number;
    env: string;
    debug: boolean;
    version: string;
    sessionSecret: string;
    telegramToken: string;
    jwtSecret: string;
    baseUrl: string;
    logLevel: string;
}

// Setze Standardwerte für Entwicklungsumgebung
const defaultConfig = {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.DB_NAME || 'mmo_game',
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG_MODE === 'true',
    version: process.env.GAME_VERSION || '1.0.0',
    sessionSecret: process.env.SESSION_SECRET || 'default-dev-secret',
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info'
};

// Validiere nur kritische Umgebungsvariablen
const requiredEnvVars = [
    'MONGODB_URI',
    'TELEGRAM_BOT_TOKEN'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Fehlende kritische Umgebungsvariablen: ${missingEnvVars.join(', ')}`);
}

export const config: Config = defaultConfig;

// Exportiere einzelne Konfigurationswerte für einfacheren Zugriff
export const {
    mongoUri,
    dbName,
    port,
    env,
    debug,
    version,
    sessionSecret,
    telegramToken,
    jwtSecret,
    baseUrl,
    logLevel
} = config; 