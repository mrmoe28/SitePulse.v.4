"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.sqlite = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.closeDatabaseConnection = closeDatabaseConnection;
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const better_sqlite3_2 = __importDefault(require("better-sqlite3"));
const schema = __importStar(require("./schema"));
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const path_1 = __importDefault(require("path"));
// Database file path (development)
const dbPath = process.env.DATABASE_URL || path_1.default.join(process.cwd(), 'dev.db');
// Create SQLite connection
exports.sqlite = new better_sqlite3_2.default(dbPath);
// Enable foreign keys and WAL mode for better performance
exports.sqlite.pragma('foreign_keys = ON');
exports.sqlite.pragma('journal_mode = WAL');
// Create Drizzle database instance with schema
exports.db = (0, better_sqlite3_1.drizzle)(exports.sqlite, {
    schema,
    logger: process.env.NODE_ENV === 'development'
});
// Auto-migrate on startup in development
if (process.env.NODE_ENV === 'development') {
    try {
        console.log('🔄 Running database migrations...');
        (0, migrator_1.migrate)(exports.db, { migrationsFolder: path_1.default.join(__dirname, '../drizzle') });
        console.log('✅ Database migrations completed');
    }
    catch (error) {
        console.warn('⚠️ Migration warning (may be normal on first run):', error);
    }
}
// Health check function
async function checkDatabaseConnection() {
    try {
        exports.sqlite.prepare('SELECT 1').get();
        return true;
    }
    catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}
// Graceful shutdown
async function closeDatabaseConnection() {
    try {
        exports.sqlite.close();
        console.log('Database connection closed gracefully');
    }
    catch (error) {
        console.error('Error closing database connection:', error);
    }
}
// Export schema and types
__exportStar(require("./schema"), exports);
__exportStar(require("./utils/auth"), exports);
