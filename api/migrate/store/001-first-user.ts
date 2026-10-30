import { Kysely, sql } from 'kysely'
import { DB } from '../../src/lib/DB/Table.schema';
import { User, zUserSchema } from '../../src/lib/DB/tables/users/user.schema'
import { ulid } from 'ulid';
import crypto from 'node:crypto';

export async function up(db: Kysely<DB>): Promise<void> {
    const init_user = JSON.parse(process.env.INIT_USER || '{}');

    // Never fall back to a well-known password: generate one unless INIT_USER provides it
    const generated_password = init_user.password ? null : crypto.randomBytes(18).toString('base64url');
    const defaults: User = {
        id: ulid(),
        first_name: 'Splitty',
        last_name: 'Test',
        phone: '8888888888',
        email: 'admin@splittytest.com',
        password: generated_password ?? '',
        role: 'admin',
        mfa: false,
        status: 'active',
    }


    const first_user = await zUserSchema.parseAsync({
        ...defaults,
        ...init_user
    });

    await db.insertInto("users").values({ ...first_user }).execute();

    if (generated_password) {
        console.log('==============================================================');
        console.log(` First admin user: ${first_user.email}`);
        console.log(` Generated password: ${generated_password}`);
        console.log(' Save it now (it is not shown again) and change it after logging in,');
        console.log(' or set INIT_USER before the first migration to choose your own.');
        console.log('==============================================================');
    }
}

export async function down(db: Kysely<DB>): Promise<void> {
    await db.deleteFrom('users').execute();
}