import { ColumnDefinitionBuilder, sql } from "kysely";

function errorUnsupportedDbType(dbType: string) {
    return new Error(`Unsupported db type: ${dbType}`)
}

export function jsonb(dbType: string) {
    switch (dbType) {
        case 'postgres':
            return sql`jsonb`;
        case 'sqlite':
            return sql`text`;
        default:
            throw errorUnsupportedDbType(dbType);
    }
}

export function textArray(dbType: string) {
    switch (dbType) {
        case 'postgres':
            return sql`text[]`;
        case 'sqlite':
            return sql`text`;
        default:
            throw errorUnsupportedDbType(dbType);
    }
}

export function timestamptz(dbType: string) {
    switch (dbType) {
        case 'postgres':
            return sql`timestamptz`
        case 'sqlite':
            return sql`text`
        default:
            throw errorUnsupportedDbType(dbType);
    }
}

export function timestamptzDefaultNow(dbType: string) {
    switch (dbType) {
        case 'postgres':
            return sql`timestamptz DEFAULT now()`
        case 'sqlite':
            return sql`text DEFAULT CURRENT_TIMESTAMP`
        default:
            throw errorUnsupportedDbType(dbType);
    }
}

export function boolean(dbType: string) {
    switch (dbType) {
        case 'postgres':
            return sql`boolean`
        case 'sqlite':
            return sql`integer`
        default:
            throw errorUnsupportedDbType(dbType);
    }
}