import { spawn, ChildProcess } from 'child_process';
import { ulid } from 'ulid';
import { setTimeout } from 'timers/promises';
import { merge } from 'lodash-es';
import path from 'path';

// We need to access DB for setup, but in a separate process/context usually?
// For E2E we can use the same DB code since we are on the same machine/DB.
// For E2E we can use the same DB code since we are on the same machine/DB.
import DB from '../../../src/lib/DB';
import bcrypt from 'bcrypt';
import { deriveUserId } from '../../../src/lib/Utils/deriveUserId';

const API_PORT_BASE = 3060; // Use a different range for Jest tests

export interface SimulationConfig {
	duration_seconds: number;
	arrival_rate: number; // users per second
	variations: {
		id: string;
		weight: number;
		conversion_rate: number;
	}[];
	test_config?: Record<string, any>;
	env?: Record<string, string>;
}

export class TestSimulation {
    private serverProcess: ChildProcess | null = null;
    private apiUrl: string;
    private port: number;
    private testId: string | null = null;
    private isRunning = false;
    private fullApiKey: string = '';
    private testingSubject: string = 'jest_subject';
    private driverUser = { id: deriveUserId('st-e2e') }; // Prefix matches setupApiKey below

    // Stats
    public stats = {
        requests: 0,
        conversions: 0,
        variations: {} as Record<string, { views: number; conversions: number }>
    };

    constructor(private config: SimulationConfig) {
        // Assign a unique port to avoid collisions if running parallel
        this.port = API_PORT_BASE + Math.floor(Math.random() * 100);
        this.apiUrl = `http://127.0.0.1:${this.port}`;
    }

    public async start() {
        // 0. Connect DB (for setup)
        // Ensure we are connected
        if (!DB.Dict.client?.isOpen) {
            await DB.Dict.connect();
        }

        // 1. Setup Data
        await this.setupApiKey();
        await this.setupSubject();

        // 2. Start Server
        await this.spawnServer();
    }

    public async stop() {
        this.isRunning = false;
        if (this.serverProcess) {
            // Send SIGTERM first for graceful shutdown, but for E2E speed just kill
            this.serverProcess.kill();
            this.serverProcess = null; // Clear the reference
            await setTimeout(1000); // Allow port release
        }

        // Removed DB cleanup here to prevent destroying shared pool between tests.
        // Cleanup should be handled by caller (afterAll) if needed.
    }

    async createTest() {
        const headers = this.getHeaders();
        const body = {
            test: {
                name: `Jest E2E ${ulid()}`,
                subject_id: 'jest_subject',
                section_id: 'main',
                conversion_event: 'signup',
                variations: this.config.variations.map(v => ({
                    id: v.id,
                    description: v.id,
                    data: {},
                    weight: v.weight,
                    status: 'active'
                })),
                status: 'queued',
                conversion_value_strategy: 'rate',
                conversion_value_type: 'percent',
                expected_conversion_rate: 0.1,
                // Defaults
                auto_optimize: false,
                min_views: 10,
                min_conversion_views: 1,
                default_conversion_value: 1,
                exploration_percentage: 0.1,
                auto_pause_variations: false,
                losing_percentage_threshold: 0.05,
                winner_sorting_type: 'max',
                rolling_window: 1000,
                rolling_window_type: 'views',
                calculation_interval: 10,
                conversion_segments: [],
                ...this.config.test_config
            }
        };

        const res = await fetch(`${this.apiUrl}/api/tests`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`Create Test Failed: ${await res.text()}`);
        const data = await res.json() as any;
        this.testId = data.id;

        // Activate
        const actRes = await fetch(`${this.apiUrl}/api/tests/${this.testId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'active' })
        });
        if (!actRes.ok) throw new Error(`Activate Failed: ${actRes.status} ${await actRes.text()}`);

        // Init stats
        this.config.variations.forEach(v => {
            this.stats.variations[v.id] = { views: 0, conversions: 0 };
        });

        // Allow worker to pick up changes?
        await setTimeout(1000);
    }

    async runTraffic() {
        if (!this.testId) await this.createTest();

        this.isRunning = true;
        const totalRequests = Math.ceil(this.config.duration_seconds * this.config.arrival_rate);
        const delayMs = 1000 / this.config.arrival_rate;

        const workers = [];
        // Simple loop matching rate roughly
        const start = Date.now();
        let requestsSent = 0;
        let workerCount = 0;

        while (this.isRunning && requestsSent < totalRequests) {
            if (Date.now() - start > this.config.duration_seconds * 1000) break;

            workers.push(this.userFlow(requestsSent));
            requestsSent++;
            await setTimeout(delayMs);
        }

        await Promise.all(workers);
    }

    private async userFlow(workerId: number) {
        try {
            // Participate
            const headers = this.getHeaders();
            const partRes = await fetch(`${this.apiUrl}/participate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    subject_id: 'jest_subject',
                    section_id: 'main',
                    data: {}
                })
            });

            if (partRes.status !== 200) {
                const text = await partRes.text();
                console.error(`[Worker ${workerId}] Participate Failed: ${partRes.status} ${text}`);
                return;
            }

            const partData = await partRes.json() as any;
            const variationId = partData.data?.id || partData.variation?.id;
            const cookie = partRes.headers.get('set-cookie');

            if (variationId && this.stats.variations[variationId]) {
                this.stats.requests++;
                this.stats.variations[variationId].views++;

                const configVar = this.config.variations.find(v => v.id === variationId);
                if (configVar && Math.random() < configVar.conversion_rate) {
                    // Convert
                    const logHeaders: any = { ...headers };
                    if (cookie) logHeaders['Cookie'] = cookie;

                    const logRes = await fetch(`${this.apiUrl}/log`, {
                        method: 'POST',
                        headers: logHeaders,
                        body: JSON.stringify({
                            event: { type: 'signup', value: 1 }
                        })
                    });

                    if (!logRes.ok) {
                        const text = await logRes.text();
                        console.error(`[Worker ${workerId}] Log Failed: ${logRes.status} ${text}`);
                    }

                    this.stats.conversions++;
                    this.stats.variations[variationId].conversions++;
                }
            } else {
                console.warn(`[Worker ${workerId}] Unexpected Variation: ${variationId}`);
            }
        } catch (e) {
            console.error(`[Worker ${workerId}] Error:`, e);
        }
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `API-Key ${this.fullApiKey}`,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
    }

    private async setupApiKey() {
        const API_KEY_PREFIX = 'st-e2e';
        const API_KEY_VALUE = 'test';
        const FULL_KEY = `${API_KEY_PREFIX}-${API_KEY_VALUE}`;

        const existing = await (DB.Store as any)
            .selectFrom('api_keys')
            .selectAll()
            .where('prefix', '=', API_KEY_PREFIX)
            .executeTakeFirst();

        const keyData = {
            prefix: API_KEY_PREFIX,
            key: bcrypt.hashSync(FULL_KEY, 10),
            status: 'active',
            name: 'E2E Test Key',
            ip_whitelist: null as any,
            domain_whitelist: null as any,
            modified_at: new Date()
        };

        if (existing) {
            await (DB.Store as any).updateTable('api_keys')
                .set(keyData)
                .where('prefix', '=', API_KEY_PREFIX)
                .execute();
        } else {
            await (DB.Store as any).insertInto('api_keys')
                .values({
                    ...keyData,
                    created_at: new Date()
                })
                .execute();
        }

        this.fullApiKey = FULL_KEY;
    }

    private async setupSubject() {
        // Delete existing to clear cache
        await DB.Subjects.deleteById('jest_subject');
        await DB.Dict.del('tests:queue:jest_subject:main');

        await DB.Subjects.insert({
            id: 'jest_subject',
            type: 'website',
            name: 'Jest Subject',
            max_concurrent_tests: 10,
            testing_enabled: true,
            sections: [{
                id: 'main',
                max_concurrent_tests: 10,
                testing_enabled: true,
                skip_test_weight: 0,
                data: {}
            }],
            data: {},
            created_at: new Date(),
            modified_at: new Date()
        });
    }

    private async spawnServer() {
        // Similar spawn logic
        this.serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
            env: {
                ...process.env,
                NODE_CONFIG: JSON.stringify({
                    api: { port: this.port },
                    log: { level: 'debug' },
                    session: { key: 'test-secret-key' }
                }),
                ...this.config.env
            },
            stdio: ['ignore', 'inherit', 'inherit'], // Pipe logs to see errors
            cwd: process.cwd()
        });

        // Wait for health
        let ready = false;
        for (let i = 0; i < 60; i++) {
            try {
                await fetch(`${this.apiUrl}/`);
                ready = true;
                break;
            } catch (e) { }
            await setTimeout(500);
        }
        if (!ready) throw new Error('Server start timeout');
    }
}
