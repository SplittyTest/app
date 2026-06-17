
import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import { TestSimulation } from './lib/TestSimulation';
import DB from '../../src/lib/DB';

// Increase timeout for E2E
jest.setTimeout(120000);

describe('E2E Scenarios (DuckDB)', () => {
    let sim: TestSimulation | null = null;

    // Global Cleanup
    afterAll(async () => {
        try {
            console.log('Global Teardown: Closing DB connections...');
            await DB.Store.destroy();
            if (DB.Dict.client?.isOpen) {
                await DB.Dict.disconnect();
            }
        } catch (e) {
            console.error('Global Teardown Error:', e);
        }
    });

    afterEach(async () => {
        if (sim) {
            console.log('Cleaning up simulation...');
            await sim.stop();
            sim = null;
        }
    });

    // We only really need to verify that data is being written/read correctly from DuckDB.
    // So running the "Optimization OFF" test is a good proxy for basic functionality (counts, etc).
    // The "Optimization ON" test checks complex aggregation which is also valuable.

    test('Optimization ON: Should favor the winner (DuckDB)', async () => {
        sim = new TestSimulation({
            duration_seconds: 30,
            arrival_rate: 10,
            variations: [
                { id: 'control', weight: 50, conversion_rate: 0.1 },
                { id: 'winner', weight: 50, conversion_rate: 0.6 }
            ],
            test_config: {
                auto_optimize: true,
                analysis: 'multi_arm_bandit',
                calculation_interval: 5
            },
            env: {
                // FORCE Metrics to use DuckDB
                METRICS_TYPE: 'duckdb'
            }
        });

        await sim.start();
        await sim.runTraffic();

        const views = sim.stats.variations;
        const total = views.control.views + views.winner.views;

        console.log('[DuckDB] Opt ON Results:', views);

        // Expect winner to have > 60% of traffic
        // This validates that getTestStats / getSeriesData (if used by optimizer) is working
        expect(views.winner.views).toBeGreaterThan(views.control.views);
        expect(views.winner.views / total).toBeGreaterThan(0.60);
    });

    test('Optimization OFF: Should keep 50/50 split (DuckDB)', async () => {
        sim = new TestSimulation({
            duration_seconds: 30,
            arrival_rate: 10,
            variations: [
                { id: 'control', weight: 50, conversion_rate: 0.1 },
                { id: 'winner', weight: 50, conversion_rate: 0.6 }
            ],
            test_config: {
                auto_optimize: false, // Standard Test
                analysis: 'standard'
            },
            env: {
                METRICS_TYPE: 'duckdb'
            }
        });

        await sim.start();
        await sim.runTraffic();

        const views = sim.stats.variations;
        const total = views.control.views + views.winner.views;

        console.log('[DuckDB] Opt OFF Results:', views);

        // Expect roughly equal split (allow variance)
        const controlShare = views.control.views / total;
        expect(controlShare).toBeGreaterThan(0.40);
        expect(controlShare).toBeLessThan(0.60);
    });

});
