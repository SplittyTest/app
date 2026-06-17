
import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import { TestSimulation } from './lib/TestSimulation';
import DB from '../../src/lib/DB';

// Increase timeout for E2E
jest.setTimeout(120000);

describe('E2E Scenarios', () => {
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

    test('Optimization ON: Should favor the winner', async () => {
        sim = new TestSimulation({
            duration_seconds: 30,
            arrival_rate: 10,
            variations: [
                { id: 'control', weight: 1, conversion_rate: 0.1 },
                { id: 'winner', weight: 1, conversion_rate: 0.6 }
            ],
            test_config: {
                auto_optimize: true,
                analysis: 'multi_arm_bandit',
                calculation_interval: 5
            }
        });

        await sim.start();
        await sim.runTraffic();
        // Stop is handled by afterEach, but can call explicitly if desired to verify state before teardown 
        // (though stats are available on sim instance)

        const views = sim.stats.variations;
        const total = views.control.views + views.winner.views;

        console.log('Opt ON Results:', views);

        // Expect winner to have > 60% of traffic
        expect(views.winner.views).toBeGreaterThan(views.control.views);
        expect(views.winner.views / total).toBeGreaterThan(0.60);
    });

    test('Optimization OFF: Should keep 50/50 split', async () => {
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
            }
        });

        await sim.start();
        await sim.runTraffic();

        const views = sim.stats.variations;
        const total = views.control.views + views.winner.views;

        console.log('Opt OFF Results:', views);

        // Expect roughly equal split (allow variance)
        const controlShare = views.control.views / total;
        expect(controlShare).toBeGreaterThan(0.40);
        expect(controlShare).toBeLessThan(0.60);
    });

});
