export const create_events_sql = `
    CREATE TABLE IF NOT EXISTS
        events (
            \`id\` String DEFAULT generateULID (),
            \`session_id\` String,
            \`type\` String,
            \`subject_id\` String,
            \`test_ids\` Array(String),
            \`variation_ids\` Array(String),
            \`control_sections\` Array(String),
            \`data\` JSON,
            \`value\` Float32,
            \`created_at\` DateTime DEFAULT now()
        )
    ENGINE = MergeTree
    PRIMARY KEY (id, created_at, session_id)
    ORDER BY (id, created_at, session_id, type, subject_id, test_ids, variation_ids, control_sections)
    PARTITION BY toYYYYMM(created_at)
    SETTINGS index_granularity = 8192
`;
