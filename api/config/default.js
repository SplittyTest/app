const path = require('path');
const fs = require('fs');
const BunyanFormat = require('bunyan-format');

const config = {
    ui: {
        path: path.resolve(__dirname, '../../ui/dist')
    },
    api: {
        port: 3000,
        shutdown_grace_period: 100
    },
    app: {
        url: 'http://localhost:3001'
    },
    auth: {
        secret: process.env.AUTH_SECRET,
        google: {
            id: '',
            callback_url: '',
            scope: ['profile'],
            state: true
        },
        jwt: {
            issuer: 'whatchamatest',
        }
    },
    log: {
        name: 'splitty_test',
        stream: 'short',
        level: 'debug',
    },
    cache: {
        // type: 'lru',
        type: 'redis',
        expiration: {
            default: 300,
            short: 30,
            long: 3600
        }
    },
    migrator: {
        type: process.env.MIGRATOR_TYPE || 'store',
    },
    db: {
        dict: {
            type: 'redis',
            redis: {
                host: 'localhost',
                port: 6379
            },
        },
        olap: {
            database: 'splittytest',
            type: 'clickhouse',
            clickhouse: {
                url: 'http://localhost:8123',
                username: 'default',
                password: 'default',
                database: 'splittytest',
                request_timeout: 120000,
                clickhouse_settings: {
                    date_time_output_format: 'iso',
                }
            },
            duckdb: {
                path: (() => {
                    const xdgDirs = process.env.XDG_DATA_DIRS ? process.env.XDG_DATA_DIRS.split(':') : [];
                    const baseDir = xdgDirs.length > 0 && xdgDirs[0] ? xdgDirs[0] : path.join(process.env.HOME || '.', '.local', 'share');
                    return path.join(baseDir, 'splittytest', 'duck.db');
                })(),
            },
        },
        store: {
            type: 'postgres',
            postgres: {
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: process.env.POSTGRES_PASSWORD,
                database: 'splittytest',
            },
            sqlite: {
                path: path.join(process.env.XDG_DATA_DIRS || path.join(process.env.HOME || '.', '.local', 'share'), 'splittytest/sqlite.db'),
            },
        },
    },
    email: {
        from: 'Splitty Test <no-reply@splittytest.com>',
        reply_to: 'Splitty Test <no-reply@splittytest.com>',
        service: 'mailgun',
        transport: {
            auth: {
                api_key: process.env.MAILGUN_API_KEY,
                domain: process.env.MAILGUN_DOMAIN
            },
        }
    },
    session: {
        store: 'redis',
        key: process.env.SESSION_SECRET || 'test-secret',
    },
    upload: {
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif'],
        local: {
            folder: path.join(process.cwd(), 'public/uploads/'),
        },
        size_limit: 25, // in MB
        storage_type: 'local',
        // storage_type: 's3',
        // storage_type: 'gcs',
    }
};

module.exports = config;