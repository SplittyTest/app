
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { TestSimulation } from './lib/TestSimulation';
import DB from '../../src/lib/DB';
import { ulid } from 'ulid';
import crypto from 'node:crypto';

describe('Promotion System', () => {
    let sim: TestSimulation;
    let test_id: string;
    let project_id = 'jest_project';
    let section_id = 'main';
    let tester_id = ulid();
    let session_cookie = '';

    beforeAll(async () => {
        sim = new TestSimulation({
            duration_seconds: 10,
            arrival_rate: 1,
            variations: [], // We create test manually below
            env: { METRICS_TYPE: process.env.METRICS_TYPE || 'postgres' }
        });
        await sim.start();

        // Promoting requires a signed-in tester (project API keys can't promote)
        const tester_email = `promotion-tester-${tester_id.toLowerCase()}@example.com`;
        const tester_password = crypto.randomBytes(16).toString('hex');
        await DB.Users.insert({
            id: tester_id,
            first_name: 'Promotion',
            last_name: 'Tester',
            email: tester_email,
            password: tester_password,
            role: 'tester',
            mfa: false,
            status: 'active',
        } as any);
        const login = await fetch(`${(sim as any).apiUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: tester_email, password: tester_password }),
        });
        expect(login.status).toBe(200);
        session_cookie = (login.headers.get('set-cookie') || '').split(';')[0];

        // Create a test with Var A as Control
        test_id = ulid();
        await DB.Tests.insert({
            id: test_id,
            name: 'Promotion Test',
            created_by: ulid(),
            created_at: new Date(),
            project_id,
            section_id,
            status: 'active',
            variations: [
                { id: `${test_id}-A`, description: 'Control', status: 'active', is_control: true, data: {} },
                { id: `${test_id}-B`, description: 'Challenger', status: 'active', is_control: false, data: {} }
            ],
            // Defaults
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
        } as any);
    });

    afterAll(async () => {
        if (sim) await sim.stop();
        await DB.Tests.deleteById(test_id);
        await DB.Users.deleteById(tester_id);
    });

    test('should promote a variation to control', async () => {
        // 1. Promote B to Control
        const response = await fetch(`${(sim as any).apiUrl}/api/tests/${test_id}/promote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': session_cookie
            },
            body: JSON.stringify({
                variation_id: `${test_id}-B`
            })
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.new_control).toBe(`${test_id}-B`);

        // 2. Verify DB Update
        const test = await DB.Tests.getById(test_id);
        const control = test?.variations.find((v: any) => v.is_control);
        expect(control?.id).toBe(`${test_id}-B`);

        const oldControl = test?.variations.find((v: any) => v.id === `${test_id}-A`);
        expect(oldControl?.is_control).toBe(false);

        // 3. Verify Audit Log
        const logs = await DB.StatusLogs.getByTestId(test_id);
        const promoLog = logs.find((l: any) => l.data.status === 'PROMOTION');
        expect(promoLog).toBeDefined();
        // Cast to any to access data properties if types are strict
        const logData = (promoLog as any)?.data;
        expect(logData.previous_control).toBe(`${test_id}-A`);
        expect(logData.new_control).toBe(`${test_id}-B`);
    });
});
