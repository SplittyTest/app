
import { Kysely } from 'kysely'
import { DB } from '../../src/lib/DB/Table.schema';
import { Variation } from '../../src/lib/DB/tables/tests/test.schema';

export async function up(db: Kysely<DB>): Promise<void> {
    // Kysely with Postgres dialect usually handles JSON parsing/serialization automatically if the column is defined as JSON type.
    // However, depending on how `api/src/lib/DB` is set up, it might be string or object.
    // Given the `generateCrud` creates generic wrappers, let's look at `migrate/utils.ts` or just safe check.
    // The previous error in SQLite migration was about explicit types, so we will be careful with casting.

    // Get all tests
    const tests = await db.selectFrom('tests').selectAll().execute();

    for (const test of tests) {
        const t = test as any;
        if (!t.variations) continue;

        // Postgres specific: if the column is JSON/JSONB, `t.variations` might already be an object.
        let variations: Variation[] = [];
        try {
            if (typeof t.variations === 'string') {
                variations = JSON.parse(t.variations);
            } else if (Array.isArray(t.variations)) {
                variations = t.variations;
            } else if (typeof t.variations === 'object') {
                // Might be object but not array? Unlikely for variations list.
                variations = Object.values(t.variations);
            }
        } catch (e) {
            console.error(`Failed to parse variations for test ${t.id}`, e);
            continue;
        }

        if (!Array.isArray(variations) || variations.length === 0) continue;

        let modified = false;

        // Check if any variation is already control
        const hasControl = variations.some(v => v.is_control);

        if (!hasControl) {
            // Find variation ending in -A
            let controlVar = variations.find(v => v.id.endsWith('-A'));
            // Fallback to first
            if (!controlVar) {
                controlVar = variations[0];
            }

            if (controlVar) {
                controlVar.is_control = true;
                modified = true;
            }
        }

        if (modified) {
            // Update the test
            await db.updateTable('tests')
                .set({ variations: JSON.stringify(variations) as any })
                .where('id' as any, '=', t.id)
                .execute();
        }
    }
}

export async function down(db: Kysely<DB>): Promise<void> {
    // Get all tests
    const tests = await db.selectFrom('tests').selectAll().execute();

    for (const test of tests) {
        const t = test as any;
        if (!t.variations) continue;

        let variations: Variation[] = [];
        try {
            if (typeof t.variations === 'string') {
                variations = JSON.parse(t.variations);
            } else if (Array.isArray(t.variations)) {
                variations = t.variations;
            }
        } catch (e) {
            continue;
        }

        if (!Array.isArray(variations) || variations.length === 0) continue;

        const modifiedVariations = variations.map(v => {
            const { is_control, ...rest } = v;
            return rest;
        });

        await db.updateTable('tests')
            .set({ variations: JSON.stringify(modifiedVariations) as any })
            .where('id' as any, '=', t.id)
            .execute();
    }
}
