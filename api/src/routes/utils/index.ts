import { requireRole } from '@/lib/Auth';
import config from 'config';
import { Router } from 'express';
import { includes } from 'lodash-es';
import multer from 'multer';

// ------------------------------------------------------------
// STORAGE CONFIGURATION

// Create an instance of the multer middleware with the desired configuration
let storage;
const storage_type = config.get('upload.storage_type');
if (storage_type === 'local') {
	const storage_config = config.get('upload.local') as { folder: string };

	storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, storage_config.folder);
		},
		filename: function (req, file, cb) {
			cb(null, file.originalname);
		},
	});
} else if (storage_type === 's3') {
	// Configure S3 storage here
} else if (storage_type === 'gcs') {
	// Configure GCS storage here
} else {
	throw new Error(`Unsupported storage type: ${storage_type}`);
}

const size_limit = config.get('upload.size_limit') as number;
const allowed_mime_types = config.get('upload.mime_types') as string[];
const upload = multer({
	storage,
	limits: {
		fileSize: size_limit * 1024 * 1024,
	},
	fileFilter: function (req, file, cb) {
		// Accept only image files
		if (!includes(allowed_mime_types, file.mimetype)) {
			// @ts-ignore
			return cb(new Error('Only image files are allowed!'), false);
		}
		cb(null, true);
	},
});

// END STORAGE CONFIGURATION
// ------------------------------------------------------------

export default function (router: Router) {
	router
		.route('/upload/image')

		// Upload a single file and return the public route to access it
		.post(requireRole('tester'), upload.single('file'), async (req, res) => {
			if (!req.file) {
				return res.status(400).json({ error: 'No file uploaded' });
			}

			// Construct the public URL to access the uploaded file
			const fileUrl = `/uploads/${req.file.filename}`;

			res.status(201).json({ url: fileUrl });
		});
}
