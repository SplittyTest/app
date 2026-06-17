import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { TestSimulation } from './lib/TestSimulation';
import DB from '../../src/lib/DB';
import { ulid } from 'ulid';
import { Test } from '../../src/types/schemas';
import { setTimeout } from 'timers/promises';
import path from 'path';
import fs from 'fs';

describe('Ambient Mode', () => {
    let sim: TestSimulation;
    let test_id: string;
    let subject_id = 'jest_subject';
    let section_id = 'main';
    let user_id = ulid();
    const tempDbPath = path.resolve(__dirname, `ambient_${ulid()}.db`);

    let ambientTest: Test;

    beforeAll(async () => {
        sim = new TestSimulation({
            duration_seconds: 10,
            arrival_rate: 1,
            variations: [],
            env: {
                METRICS_TYPE: 'duckdb'
            }
        });
        await sim.start();

        // 0. Manual Connect to Metrics DB in Test Runner to verify
        // The `DB` import might have initialized with defaults.
        // If we want to verify, we need to ensure we query the same DB.
        // If defaults match, good.

        test_id = ulid();
        ambientTest = {
            id: test_id,
            name: 'Ambient Test',
            subject_id,
            section_id,
            status: 'ambient',
            variations: [
                { id: `${test_id}-A`, description: 'Control', status: 'active', is_control: true, data: {} },
                { id: `${test_id}-B`, description: 'Variant', status: 'active', is_control: false, data: {} }
            ],
            conversion_event: 'click',
            conversion_value_strategy: 'sum',
            conversion_value_type: 'number',
            default_conversion_value: 1,
            winner_sorting_type: 'max',
            expected_conversion_rate: 0.5,
            min_views: 100,
            auto_optimize: false,
            calculation_interval: 300,
            analysis: 'standard',
            rolling_window_type: 'none',
            rolling_window: 10000,
            exploration_percentage: 0.1,
            auto_pause_variations: true,
            min_conversion_views: 100,
            losing_percentage_threshold: 0.3,
            conversion_segments: [],
            created_by: user_id,
            created_at: new Date()
        } as unknown as Test;

        await DB.Tests.insert(ambientTest);
        await DB.Dict.rpush(`tests:ambient:${subject_id}:${section_id}`, test_id);
    });

    afterAll(async () => {
        if (sim) await sim.stop();
        await DB.Tests.deleteById(test_id);
        await DB.Dict.del(`tests:ambient:${subject_id}:${section_id}`);
        await DB.Store.destroy();
        if (DB.Dict.client?.isOpen) await DB.Dict.disconnect();
        // Also disconnect Metrics if possible?
        // DB.Metrics.disconnect isn't exposed on generic interface everywhere but DuckDB has it?
        // The interface `MetricsDB` has disconnect? (Checked DuckDB.ts, it has disconnect. Checked Metrics.ts, it returns MetricsDB).
        // Let's try.
        if (DB.Metrics.disconnect) await DB.Metrics.disconnect();

        // Clean up default duckdb file?
        // const dbPath = ...
        // fs.unlinkSync(dbPath);
    });

    test('should return null variation but log participation for ambient test', async () => {
        // 1. Trigger Participation
        const response = await fetch(`${(sim as any).apiUrl}/participate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `API-Key ${(sim as any).fullApiKey}`
            },
            body: JSON.stringify({
                subject_id,
                section_id
            })
        });

        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.variation).toBeNull();
        expect(body.session_id).toBeDefined();

        // 2. Verify Metrics
        await setTimeout(1000); // Allow async flush

        // We use getTestStats to verify.
        // But first we must ensure DB.Metrics is using DuckDB and connected.
        // Since we didn't force reload of DB module, it uses default config.
        // If config default is DuckDB, good.
        // We set METRICS_TYPE=duckdb in the TEST RUNNER COMMAND too, right?
        // Step 290 command was `STORE_TYPE=postgres METRICS_TYPE=postgres`.
        // We should run with `METRICS_TYPE=duckdb`.

        // Assuming we will run with correct ENV.

        const stats = await DB.Metrics.getTestStats(ambientTest);

        // Find Control Stats
        const controlStat = stats.find((s: Record<string, any>) => s.variation_id === `${test_id}-A`);

        expect(controlStat).toBeDefined();
        // We expect at least 1 view.
        expect(controlStat?.views).toBeGreaterThanOrEqual(1);
    });
});
