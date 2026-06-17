import { Kysely, sql } from 'kysely'
import { DB } from '../../src/lib/DB/Table.schema';
import { User, zUserSchema } from '../../src/lib/DB/tables/users/user.schema'
import { ulid } from 'ulid';

export async function up(db: Kysely<DB>): Promise<void> {
    const init_user = JSON.parse(process.env.INIT_USER || '{}');
    const defaults: User = {
        id: ulid(),
        first_name: 'Splitty',
        last_name: 'Test',
        phone: '8888888888',
        email: 'admin@splittytest.com',
        password: 'password',
        role: 'admin',
        mfa: false,
        status: 'active',
    }


    const first_user = await zUserSchema.parseAsync({
        ...defaults,
        ...init_user
    });

    await db.insertInto("users").values({ ...first_user }).execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
    await db.deleteFrom('users').execute();
}