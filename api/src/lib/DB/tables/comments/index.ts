import { generateCrud } from '@/lib/Utils/generateCrud';
import { Comment, zCommentSchema } from './comment.schema';
import { ulid } from 'ulid';
import { flatten, isUndefined, pick } from 'lodash-es';
import Store from '../../Store';
import { sendWebhook } from '@/lib/Utils/webhook';
import { asyncForEach } from 'modern-async';
import DB from '../..';

const table_name = 'comments';
const table_schema = zCommentSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// Get all comments for a test
export async function getByTestId(test_id: string) {
	return await Store.selectFrom(table_name)
		.leftJoin('users', 'comments.user_id', 'users.id')
		.select([
			'comments.id',
			'comments.user_id',
			'comments.content',
			'comments.created_at',
			'comments.modified_at',
			'users.first_name',
			'users.last_name',
		])
		.where('test_id', '=', test_id)
		.orderBy('created_at')
		.execute();
}

export async function insert(data: Comment | Comment[]): Promise<Comment | Comment[] | null> {
	const result = await defaultInsert(data);

	if (result) {
		asyncForEach(flatten([result]), async (comment) => {
			const test = await DB.Tests.getById(comment.test_id);
			const user = await DB.Users.getById(comment.user_id!);

			sendWebhook('test_comment', {
				subject_id: test?.subject_id,
				test_id: comment.test_id,
				comment_id: comment.id,
				user_id: comment.user_id,
				user: pick(user, ['first_name', 'last_name', 'email']),
				content: comment.content,
			});
		});
	}

	return result;
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const {
	getById,
	getByFilter,
	getAll,
	insert: defaultInsert,
	updateById,
	updateByFilter,
	deleteById,
	deleteByFilter,
} = generateCrud<Comment>(table_name, table_schema, {
	defaults: (v) => {
		if (isUndefined(v.id)) {
			v.id = ulid();
		}
		if (isUndefined(v.created_at)) {
			v.created_at = new Date();
		}
		return v;
	},
});

export { getById, getByFilter, getAll, updateById, updateByFilter, deleteById, deleteByFilter };
