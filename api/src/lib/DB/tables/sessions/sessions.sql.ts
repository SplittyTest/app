export const create_sessions_sql = `
    CREATE TABLE IF NOT EXISTS
        sessions (
            \`id\` String DEFAULT generateULID (),
            \`subject_id\` String,
            \`test_ids\` Array(String),
            \`variation_ids\` Array(String),
            \`control_sections\` Array(String),
            \`data\` JSON,
            \`created_at\` DateTime DEFAULT now()
        )
    ENGINE = ReplacingMergeTree
    PRIMARY KEY (id, created_at, subject_id)
    ORDER BY (id, created_at, subject_id, test_ids, variation_ids, control_sections)
    PARTITION BY toYYYYMM(created_at)
    SETTINGS index_granularity = 8192
`;
