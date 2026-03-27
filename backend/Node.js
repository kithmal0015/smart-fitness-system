const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 5000);
const mongoUri =
	process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-fitness-system';
const accessRequestDbMode = String(process.env.ACCESS_REQUEST_DB || 'mongo').toLowerCase();
const sqliteDbPath =
	process.env.ACCESS_REQUEST_SQLITE_PATH || path.join(__dirname, 'data', 'access-requests.db');
const allowStartWithoutMongo = String(process.env.ALLOW_START_WITHOUT_MONGO || 'false').toLowerCase() === 'true';
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
const tokenExpiry = '8h';
const resetTokenExpiryMinutes = Number(process.env.RESET_TOKEN_EXP_MINUTES || 15);
function normalizeEnv(value) {
	const raw = String(value || '').trim();
	if (!raw) {
		return '';
	}

	if (
		(raw.startsWith('"') && raw.endsWith('"')) ||
		(raw.startsWith("'") && raw.endsWith("'"))
	) {
		return raw.slice(1, -1).trim();
	}

	return raw;
}

const smtpHost = normalizeEnv(process.env.SMTP_HOST);
const smtpPort = Number(normalizeEnv(process.env.SMTP_PORT) || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = normalizeEnv(process.env.SMTP_USER);
const smtpPass = normalizeEnv(process.env.SMTP_PASS);
const smtpFrom = normalizeEnv(process.env.SMTP_FROM) || smtpUser;
const accessReviewMailEnabled =
	String(process.env.ACCESS_REVIEW_MAIL_ENABLED || 'true').toLowerCase() === 'true';
const registerPaymentMailEnabled =
	String(process.env.REGISTER_PAYMENT_MAIL_ENABLED || 'true').toLowerCase() === 'true';

const adminUserName = process.env.ADMIN_USERNAME || 'Kithmal0015';
const adminPasswordFromEnv = process.env.ADMIN_PASSWORD || '12345';
let adminPasswordHash =
	process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(adminPasswordFromEnv, 10);
let activeResetToken = null;
let activeMobileResetOtp = null;
let mailTransporter = null;
const trainerImageFallback = 'https://via.placeholder.com/40';

const corsOrigin = process.env.ADMIN_DASHBOARD_ORIGIN || 'http://localhost:3000';
const advertisementStaticDir = path.join(__dirname, 'data', 'ads');

app.use(
	cors({
		origin: corsOrigin,
		credentials: true,
	})
);
app.use(express.json({ limit: '10mb' }));
app.use('/static/ads', express.static(advertisementStaticDir));

let accessRequestStore = null;

const trainerSchema = new mongoose.Schema(
	{
		trainerId: {
			type: String,
			required: true,
			trim: true,
			uppercase: true,
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		gender: {
			type: String,
			enum: ['Male', 'Female'],
			required: true,
		},
		age: {
			type: Number,
			required: true,
			min: 16,
			max: 100,
		},
		dob: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: ['Active', 'Inactive'],
			default: 'Active',
		},
		profileImage: {
			type: String,
			default: trainerImageFallback,
		},
	},
	{
		timestamps: true,
	}
);

trainerSchema.index({ trainerId: 1 }, { unique: true });
trainerSchema.index({ email: 1 }, { unique: true });

const Trainer = mongoose.models.Trainer || mongoose.model('Trainer', trainerSchema);

const profileSchema = new mongoose.Schema(
	{
		userName: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		displayName: {
			type: String,
			default: '',
			trim: true,
		},
		profileImage: {
			type: String,
			default: '',
		},
	},
	{
		timestamps: true,
	}
);

profileSchema.index({ userName: 1 }, { unique: true });

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

const mobileUserSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		gender: {
			type: String,
			default: '',
			trim: true,
		},
		phoneNumber: {
			type: String,
			default: '',
			trim: true,
		},
		dateOfBirth: {
			type: Date,
			default: null,
		},
		profileImage: {
			type: String,
			default: '',
		},
		membership: {
			status: {
				type: String,
				enum: ['active'],
				default: 'active',
			},
			activatedAt: {
				type: Date,
				default: Date.now,
			},
		},
		payment: {
			admissionFee: {
				type: Number,
				required: true,
			},
			monthFee: {
				type: Number,
				required: true,
			},
			totalAmount: {
				type: Number,
				required: true,
			},
			currency: {
				type: String,
				default: 'LKR',
			},
			method: {
				type: String,
				default: 'card',
			},
			cardLast4: {
				type: String,
				default: '',
			},
			paidAt: {
				type: Date,
				default: Date.now,
			},
			termsAccepted: {
				type: Boolean,
				required: true,
			},
		},
	},
	{
		timestamps: true,
	}
);

mobileUserSchema.index({ email: 1 }, { unique: true });

const MobileUser =
	mongoose.models.MobileUser || mongoose.model('MobileUser', mobileUserSchema, 'users');

const advertisementSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		subtitle: {
			type: String,
			default: '',
			trim: true,
		},
		image: {
			type: String,
			required: true,
		},
		displayOrder: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

advertisementSchema.index({ isActive: 1, displayOrder: 1, updatedAt: -1 });

const Advertisement =
	mongoose.models.Advertisement ||
	mongoose.model('Advertisement', advertisementSchema, 'advertisements');

function toAdvertisementResponseItem(item) {
	return toAdvertisementResponseItemForRequest(item, null);
}

function toAdvertisementResponseItemForRequest(item, req) {
	if (!item) {
		return null;
	}

	const rawImage = String(item.image || '').trim();
	const image =
		req && rawImage.startsWith('/')
			? `${req.protocol}://${req.get('host')}${rawImage}`
			: rawImage;

	return {
		_id: String(item._id),
		title: String(item.title || '').trim(),
		subtitle: String(item.subtitle || '').trim(),
		image,
		displayOrder: Number(item.displayOrder || 0),
		isActive: Boolean(item.isActive),
		createdAt: item.createdAt || null,
		updatedAt: item.updatedAt || null,
	};
}

async function seedDefaultAdvertisementsIfEmpty() {
	const count = await Advertisement.countDocuments({});
	if (count > 0) {
		return;
	}

	const defaults = [
		{
			title: 'New Year Table',
			subtitle: 'New Year Table Event. See you on Apr 14, 2026, at 08:30 AM at the gym!',
			image: '/static/ads/ad-1.jpg',
			displayOrder: 1,
			isActive: true,
		},
		{
			title: 'Cricket Match',
			subtitle: 'The event is scheduled for April 22, 2026, at 9:00 AM, and will be held at Saniro, Veyangoda.',
			image: '/static/ads/ad-2.jpg',
			displayOrder: 2,
			isActive: true,
		},
		{
			title: 'New Packages',
			subtitle: 'Introductory Membership Packages with New Member Special Offers',
			image: '/static/ads/ad-3.jpg',
			displayOrder: 3,
			isActive: true,
		},
	];

	await Advertisement.insertMany(defaults);
}

function toTrainerResponseItem(item) {
	if (!item) {
		return null;
	}

	return {
		_id: String(item._id),
		trainerId: item.trainerId,
		firstName: item.firstName,
		lastName: item.lastName,
		email: item.email,
		gender: item.gender,
		age: item.age,
		dob: item.dob,
		status: item.status,
		profileImage: item.profileImage || trainerImageFallback,
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
	};
}

function calculateAgeFromDate(dobDate) {
	const today = new Date();
	let age = today.getFullYear() - dobDate.getFullYear();
	const monthDiff = today.getMonth() - dobDate.getMonth();
	const hasNotHadBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate());

	if (hasNotHadBirthday) {
		age -= 1;
	}

	return age;
}

function parseDobFromRegisterInput(rawDob) {
	const text = String(rawDob || '').trim();
	if (!text) {
		return null;
	}

	const normalized = text.replace(/\s+/g, '');
	const dobPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
	const match = normalized.match(dobPattern);
	if (!match) {
		return null;
	}

	const day = Number(match[1]);
	const month = Number(match[2]);
	const year = Number(match[3]);
	const parsed = new Date(year, month - 1, day);

	if (
		Number.isNaN(parsed.getTime()) ||
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return null;
	}

	return parsed;
}

function toMobileMemberResponseItem(item) {
	if (!item) {
		return null;
	}

	const dobDate = item.dateOfBirth ? new Date(item.dateOfBirth) : null;
	const hasValidDob = dobDate && !Number.isNaN(dobDate.getTime());
	const membershipStatus =
		item.membership && String(item.membership.status || '').toLowerCase() === 'active'
			? 'Active'
			: 'Non Active';

	return {
		_id: String(item._id),
		firstName: String(item.firstName || '').trim(),
		lastName: String(item.lastName || '').trim(),
		email: String(item.email || '').trim().toLowerCase(),
		gender: String(item.gender || '').trim(),
		age: hasValidDob ? calculateAgeFromDate(dobDate) : '',
		dob: hasValidDob ? dobDate.toISOString() : null,
		status: membershipStatus,
		profileImage: String(item.profileImage || '').trim() || trainerImageFallback,
		createdAt: item.createdAt || null,
		updatedAt: item.updatedAt || null,
	};
}

function toMemberNotificationItem(item) {
	if (!item) {
		return null;
	}

	const firstName = String(item.firstName || '').trim();
	const lastName = String(item.lastName || '').trim();
	const fullName = `${firstName} ${lastName}`.trim();

	return {
		_id: String(item._id),
		fullName: fullName || 'New Member',
		email: String(item.email || '').trim().toLowerCase(),
		createdAt: item.createdAt || null,
	};
}

function isMailConfigured() {
	return Boolean(smtpHost && smtpPort && smtpUser && smtpPass);
}

function getMailTransporter() {
	if (!mailTransporter) {
		mailTransporter = nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort,
			secure: smtpSecure,
			auth: {
				user: smtpUser,
				pass: smtpPass,
			},
		});
	}

	return mailTransporter;
}

async function sendAccessReviewEmail({ to, userName, action, rejectReason, reviewedBy }) {
	if (!accessReviewMailEnabled) {
		return { sent: false, reason: 'mail-disabled' };
	}

	if (!isMailConfigured()) {
		console.warn('Access review email skipped: SMTP settings are incomplete');
		return { sent: false, reason: 'smtp-not-configured' };
	}

	const isApproved = action === 'approve';
	const subject = isApproved
		? 'Your Smart Fitness access request was approved'
		: 'Your Smart Fitness access request was rejected';

	const textLines = [
		`Hi ${userName || 'User'},`,
		'',
		isApproved
			? 'Your access request has been approved. You can now sign in to the admin dashboard.'
			: 'Your access request has been rejected by the admin team.',
		'',
		`Reviewed by: ${reviewedBy || adminUserName}`,
		`Reviewed at: ${new Date().toLocaleString('en-GB')}`,
	];

	if (!isApproved) {
		textLines.push(`Reason: ${rejectReason || 'No reason provided.'}`);
	}

	textLines.push('', 'If you need help, please contact support.', '', 'Smart Fitness Team');

	try {
		await getMailTransporter().sendMail({
			from: smtpFrom,
			to,
			subject,
			text: textLines.join('\n'),
		});

		return { sent: true };
	} catch (error) {
		console.error('Failed to send access review email:', error.message);

		const message = String(error && error.message ? error.message : '').toLowerCase();
		const isAuthError = error && error.code === 'EAUTH';
		const isAppPasswordRequired = message.includes('application-specific password required');

		if (isAppPasswordRequired) {
			return { sent: false, reason: 'smtp-app-password-required' };
		}

		if (isAuthError) {
			return { sent: false, reason: 'smtp-auth-failed' };
		}

		return { sent: false, reason: 'send-failed' };
	}
}

async function sendMobileResetOtpEmail({ to, firstName, otp, expiresInMinutes }) {
	if (!isMailConfigured()) {
		return { sent: false, reason: 'smtp-not-configured' };
	}

	const subject = 'Smart Fitness password reset OTP';
	const textLines = [
		`Hi ${firstName || 'Member'},`,
		'',
		'We received a request to reset your password.',
		`Your OTP code is: ${otp}`,
		`This OTP will expire in ${expiresInMinutes} minutes.`,
		'',
		'If you did not request this, please ignore this email.',
		'',
		'Smart Fitness Team',
	];

	try {
		await getMailTransporter().sendMail({
			from: smtpFrom,
			to,
			subject,
			text: textLines.join('\n'),
		});

		return { sent: true };
	} catch (_error) {
		return { sent: false, reason: 'send-failed' };
	}
}

async function sendRegisterPaymentSuccessEmail({ to, firstName, paidAmount, currency }) {
	if (!registerPaymentMailEnabled) {
		return { sent: false, reason: 'mail-disabled' };
	}

	if (!isMailConfigured()) {
		console.warn('Register/payment success email skipped: SMTP settings are incomplete');
		return { sent: false, reason: 'smtp-not-configured' };
	}

	const amount = Number.isFinite(Number(paidAmount)) ? Number(paidAmount) : null;
	const amountLine =
		amount === null
			? 'Payment status: Successful'
			: `Payment amount: ${String(currency || 'LKR').toUpperCase()} ${amount.toFixed(2)}`;

	const subject = 'Smart Fitness registration and payment successful';
	const textLines = [
		`Hi ${firstName || 'Member'},`,
		'',
		'Your registration has been completed successfully.',
		'Your payment was processed successfully.',
		amountLine,
		'',
		'You can now sign in and start using Smart Fitness.',
		'',
		'Smart Fitness Team',
	];

	try {
		await getMailTransporter().sendMail({
			from: smtpFrom,
			to,
			subject,
			text: textLines.join('\n'),
		});

		return { sent: true };
	} catch (_error) {
		return { sent: false, reason: 'send-failed' };
	}
}

function requireAdminAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

		if (!token) {
			return res.status(401).json({ message: 'Missing token' });
		}

		const decoded = jwt.verify(token, jwtSecret);
		if (!decoded || decoded.role !== 'admin') {
			return res.status(403).json({ message: 'Admin access required' });
		}

		req.admin = decoded;
		return next();
	} catch (_error) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

function requireMemberAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

		if (!token) {
			return res.status(401).json({ message: 'Missing token' });
		}

		const decoded = jwt.verify(token, jwtSecret);
		if (!decoded || decoded.role !== 'member' || !decoded.memberId) {
			return res.status(403).json({ message: 'Member access required' });
		}

		req.member = decoded;
		return next();
	} catch (_error) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

function toResponseItem(item) {
	if (!item) {
		return null;
	}

	return {
		_id: String(item._id),
		userName: item.userName,
		email: item.email,
		status: item.status,
		reviewedBy: item.reviewedBy || '',
		reviewedAt: item.reviewedAt || null,
		rejectReason: item.rejectReason || '',
		createdAt: item.createdAt || null,
		updatedAt: item.updatedAt || null,
	};
}

function mapSqliteRow(row) {
	if (!row) {
		return null;
	}

	return {
		_id: String(row.id),
		userName: row.user_name,
		email: row.email,
		passwordHash: row.password_hash,
		status: row.status,
		rejectReason: row.reject_reason,
		reviewedBy: row.reviewed_by,
		reviewedAt: row.reviewed_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function createMongoStore() {
	const accessRequestSchema = new mongoose.Schema(
		{
			userName: {
				type: String,
				required: true,
				trim: true,
				lowercase: true,
			},
			email: {
				type: String,
				required: true,
				trim: true,
				lowercase: true,
			},
			passwordHash: {
				type: String,
				required: true,
			},
			status: {
				type: String,
				enum: ['pending', 'approved', 'rejected'],
				default: 'pending',
			},
			rejectReason: {
				type: String,
				default: '',
			},
			reviewedBy: {
				type: String,
				default: '',
			},
			reviewedAt: {
				type: Date,
				default: null,
			},
		},
		{
			timestamps: true,
		}
	);

	accessRequestSchema.index({ userName: 1 });
	accessRequestSchema.index({ email: 1 });

	const AccessRequest = mongoose.models.AccessRequest || mongoose.model('AccessRequest', accessRequestSchema);

	return {
		async findActiveByUserOrEmail(userName, email) {
			return AccessRequest.findOne({
				$or: [{ userName }, { email }],
				status: { $in: ['pending', 'approved'] },
			}).lean();
		},
		async createPending({ userName, email, passwordHash }) {
			const doc = await AccessRequest.create({
				userName,
				email,
				passwordHash,
				status: 'pending',
			});

			return doc.toObject();
		},
		async listPending() {
			return AccessRequest.find({ status: 'pending' })
				.sort({ createdAt: -1 })
				.lean();
		},
		async findApprovedByUserName(userName) {
			return AccessRequest.findOne({ userName, status: 'approved' }).lean();
		},
		async updatePasswordByUserName(userName, passwordHash) {
			const updated = await AccessRequest.findOneAndUpdate(
				{ userName, status: 'approved' },
				{
					$set: {
						passwordHash,
						updatedAt: new Date(),
					},
				},
				{ new: true }
			).lean();

			return updated;
		},
		async findById(id) {
			return AccessRequest.findById(id).lean();
		},
		async review({ id, status, reviewedBy, rejectReason }) {
			const updated = await AccessRequest.findOneAndUpdate(
				{ _id: id, status: 'pending' },
				{
					$set: {
						status,
						reviewedBy,
						reviewedAt: new Date(),
						rejectReason,
					},
				},
				{ new: true }
			).lean();

			return updated;
		},
	};
}

async function createSqliteStore() {
	fs.mkdirSync(path.dirname(sqliteDbPath), { recursive: true });

	const db = await open({
		filename: sqliteDbPath,
		driver: sqlite3.Database,
	});

	await db.exec(`
		CREATE TABLE IF NOT EXISTS access_requests (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_name TEXT NOT NULL,
			email TEXT NOT NULL,
			password_hash TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			reject_reason TEXT NOT NULL DEFAULT '',
			reviewed_by TEXT NOT NULL DEFAULT '',
			reviewed_at TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)
	`);

	await db.exec(
		'CREATE INDEX IF NOT EXISTS idx_access_requests_user_name ON access_requests (user_name)'
	);
	await db.exec(
		'CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests (email)'
	);

	return {
		async findActiveByUserOrEmail(userName, email) {
			const row = await db.get(
				`SELECT * FROM access_requests
				 WHERE (user_name = ? OR email = ?)
				   AND status IN ('pending', 'approved')
				 LIMIT 1`,
				[userName, email]
			);

			return mapSqliteRow(row);
		},
		async createPending({ userName, email, passwordHash }) {
			const now = new Date().toISOString();
			const result = await db.run(
				`INSERT INTO access_requests
				 (user_name, email, password_hash, status, reject_reason, reviewed_by, reviewed_at, created_at, updated_at)
				 VALUES (?, ?, ?, 'pending', '', '', NULL, ?, ?)`,
				[userName, email, passwordHash, now, now]
			);

			const created = await db.get('SELECT * FROM access_requests WHERE id = ?', [result.lastID]);
			return mapSqliteRow(created);
		},
		async listPending() {
			const rows = await db.all(
				`SELECT * FROM access_requests
				 WHERE status = 'pending'
				 ORDER BY datetime(created_at) DESC`
			);

			return rows.map(mapSqliteRow);
		},
		async findApprovedByUserName(userName) {
			const row = await db.get(
				`SELECT * FROM access_requests
				 WHERE user_name = ?
				   AND status = 'approved'
				 LIMIT 1`,
				[userName]
			);

			return mapSqliteRow(row);
		},
		async updatePasswordByUserName(userName, passwordHash) {
			const now = new Date().toISOString();
			const result = await db.run(
				`UPDATE access_requests
				 SET password_hash = ?, updated_at = ?
				 WHERE user_name = ? AND status = 'approved'`,
				[passwordHash, now, userName]
			);

			if (result.changes === 0) {
				return null;
			}

			const updated = await db.get(
				`SELECT * FROM access_requests
				 WHERE user_name = ?
				   AND status = 'approved'
				 LIMIT 1`,
				[userName]
			);

			return mapSqliteRow(updated);
		},
		async findById(id) {
			const numericId = Number(id);
			if (!Number.isInteger(numericId)) {
				return null;
			}

			const row = await db.get('SELECT * FROM access_requests WHERE id = ?', [numericId]);
			return mapSqliteRow(row);
		},
		async review({ id, status, reviewedBy, rejectReason }) {
			const numericId = Number(id);
			if (!Number.isInteger(numericId)) {
				return null;
			}

			const now = new Date().toISOString();
			const result = await db.run(
				`UPDATE access_requests
				 SET status = ?, reviewed_by = ?, reviewed_at = ?, reject_reason = ?, updated_at = ?
				 WHERE id = ? AND status = 'pending'`,
				[status, reviewedBy, now, rejectReason, now, numericId]
			);

			if (result.changes === 0) {
				return null;
			}

			const updated = await db.get('SELECT * FROM access_requests WHERE id = ?', [numericId]);
			return mapSqliteRow(updated);
		},
	};
}

async function initializeAccessRequestStore() {
	if (accessRequestDbMode === 'sqlite') {
		console.log(`Access requests DB: sqlite (${sqliteDbPath})`);
		return createSqliteStore();
	}

	console.log('Access requests DB: mongo');
	return createMongoStore();
}

app.get('/api/health', (_req, res) => {
	res.json({ ok: true, service: 'smart-fitness-backend' });
});

app.get('/api/mobile/advertisements', async (_req, res) => {
	try {
		const items = await Advertisement.find({ isActive: true })
			.sort({ displayOrder: 1, updatedAt: -1 })
			.limit(20)
			.lean();

		return res.status(200).json({
			items: items.map((item) => toAdvertisementResponseItemForRequest(item, _req)).filter(Boolean),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load advertisements' });
	}
});

app.post('/api/mobile/register-and-pay', async (req, res) => {
	try {
		const {
			firstName,
			lastName,
			email,
			password,
			confirmPassword,
			gender,
			phoneNumber,
			dateOfBirth,
			profileImage,
			payment,
		} = req.body || {};

		if (!firstName || !lastName || !email || !password || !confirmPassword) {
			return res.status(400).json({ message: 'Missing required registration fields' });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ message: 'Passwords do not match' });
		}

		const normalizedEmail = String(email).trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			return res.status(400).json({ message: 'Enter a valid email' });
		}

		const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
		if (!strongPasswordRegex.test(String(password))) {
			return res.status(400).json({
				message: 'Use 8+ characters with letters, numbers, and symbols',
			});
		}

		const paymentPayload = payment || {};
		const includeMonthFee = Boolean(paymentPayload.includeMonthFee);
		const admissionFee = 1000;
		const monthFee = includeMonthFee ? 2000 : 0;
		const expectedTotal = admissionFee + monthFee;
		const paidTotal = Number(paymentPayload.totalAmount);

		if (paymentPayload.termsAccepted !== true) {
			return res.status(400).json({ message: 'Terms & Conditions must be accepted' });
		}

		if (String(paymentPayload.method || '').toLowerCase() !== 'card') {
			return res.status(400).json({ message: 'Only card payments are supported' });
		}

		if (paidTotal !== expectedTotal) {
			return res.status(400).json({ message: 'Invalid payment amount' });
		}

		const cleanCardNumber = String(paymentPayload.cardNumber || '').replace(/\s/g, '');
		if (!/^\d{16}$/.test(cleanCardNumber)) {
			return res.status(400).json({ message: 'Invalid card number' });
		}

		if (!/^\d{2}\/\d{2}$/.test(String(paymentPayload.expiryDate || ''))) {
			return res.status(400).json({ message: 'Invalid expiry date' });
		}

		if (!/^\d{3,4}$/.test(String(paymentPayload.cvv || ''))) {
			return res.status(400).json({ message: 'Invalid CVV' });
		}

		const existingUser = await MobileUser.findOne({ email: normalizedEmail }).lean();
		if (existingUser) {
			return res.status(409).json({ message: 'An account with this email already exists' });
		}

		const parsedDob = parseDobFromRegisterInput(dateOfBirth);
		const passwordHash = await bcrypt.hash(String(password), 10);

		const created = await MobileUser.create({
			firstName: String(firstName).trim(),
			lastName: String(lastName).trim(),
			email: normalizedEmail,
			passwordHash,
			gender: String(gender || '').trim(),
			phoneNumber: String(phoneNumber || '').trim(),
			dateOfBirth: parsedDob,
			profileImage: String(profileImage || '').trim(),
			membership: {
				status: 'active',
				activatedAt: new Date(),
			},
			payment: {
				admissionFee,
				monthFee,
				totalAmount: expectedTotal,
				currency: 'LKR',
				method: 'card',
				cardLast4: cleanCardNumber.slice(-4),
				paidAt: new Date(),
				termsAccepted: true,
			},
		});

		const registerPaymentMailResult = await sendRegisterPaymentSuccessEmail({
			to: created.email,
			firstName: created.firstName,
			paidAmount: created.payment && created.payment.totalAmount,
			currency: created.payment && created.payment.currency,
		});

		if (!registerPaymentMailResult.sent && registerPaymentMailResult.reason !== 'mail-disabled') {
			console.warn(
				`Register/payment success email not sent for ${created.email}: ${registerPaymentMailResult.reason}`
			);
		}

		return res.status(201).json({
			message: 'User account created and payment recorded successfully',
			item: {
				id: String(created._id),
				email: created.email,
				membershipStatus: created.membership && created.membership.status,
				paidAmount: created.payment && created.payment.totalAmount,
				emailNotificationSent: Boolean(registerPaymentMailResult.sent),
			},
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({ message: 'An account with this email already exists' });
		}

		return res.status(500).json({ message: 'Failed to complete registration and payment' });
	}
});

app.post('/api/mobile/login', async (req, res) => {
	try {
		const email = String((req.body && req.body.email) || '').trim().toLowerCase();
		const password = String((req.body && req.body.password) || '');

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ message: 'Enter a valid email' });
		}

		const member = await MobileUser.findOne({ email }).lean();
		if (!member) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const isPasswordValid = await bcrypt.compare(password, String(member.passwordHash || ''));
		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const memberId = String(member._id);
		const token = jwt.sign(
			{
				sub: `member-${memberId}`,
				role: 'member',
				memberId,
				email,
			},
			jwtSecret,
			{ expiresIn: tokenExpiry }
		);

		return res.status(200).json({
			message: 'Sign in successful',
			token,
			item: toMobileMemberResponseItem(member),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Sign in failed. Please try again.' });
	}
});

app.put('/api/mobile/profile', requireMemberAuth, async (req, res) => {
	try {
		const memberId = String((req.member && req.member.memberId) || '').trim();
		if (!mongoose.isValidObjectId(memberId)) {
			return res.status(400).json({ message: 'Invalid member id' });
		}

		const firstName = String((req.body && req.body.firstName) || '').trim();
		const lastName = String((req.body && req.body.lastName) || '').trim();
		const profileImage = String((req.body && req.body.profileImage) || '').trim();

		if (!firstName || !lastName) {
			return res.status(400).json({ message: 'First name and last name are required' });
		}

		if (profileImage && !profileImage.startsWith('data:image/') && !/^https?:\/\//i.test(profileImage)) {
			return res.status(400).json({ message: 'Profile image format is invalid' });
		}

		const updated = await MobileUser.findByIdAndUpdate(
			memberId,
			{
				$set: {
					firstName,
					lastName,
					...(profileImage ? { profileImage } : {}),
				},
			},
			{ new: true, runValidators: true }
		).lean();

		if (!updated) {
			return res.status(404).json({ message: 'Member not found' });
		}

		return res.status(200).json({
			message: 'Profile updated successfully',
			item: toMobileMemberResponseItem(updated),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to update profile' });
	}
});

app.post('/api/mobile/forgot-password', async (req, res) => {
	try {
		const email = String((req.body && req.body.email) || '').trim().toLowerCase();

		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ message: 'Enter a valid email' });
		}

		const genericMessage =
			'If the account exists, an OTP has been generated for password reset.';

		const member = await MobileUser.findOne({ email }).lean();
		if (!member) {
			return res.status(200).json({ message: genericMessage });
		}

		const otpCode = String(crypto.randomInt(100000, 1000000));
		const expiresAt = Date.now() + resetTokenExpiryMinutes * 60 * 1000;

		activeMobileResetOtp = {
			otp: otpCode,
			email,
			expiresAt,
		};

		const emailResult = await sendMobileResetOtpEmail({
			to: email,
			firstName: String(member.firstName || '').trim(),
			otp: otpCode,
			expiresInMinutes: resetTokenExpiryMinutes,
		});

		if (!emailResult.sent) {
			if (emailResult.reason === 'smtp-not-configured') {
				return res.status(503).json({ message: 'OTP email service is not configured' });
			}

			return res.status(500).json({ message: 'Failed to send OTP email' });
		}

		return res.status(200).json({
			message: genericMessage,
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Unable to process forgot password request' });
	}
});

app.post('/api/mobile/reset-password', async (req, res) => {
	try {
		const otp = String((req.body && req.body.otp) || '').trim();
		const email = String((req.body && req.body.email) || '').trim().toLowerCase();
		const newPassword = String((req.body && req.body.newPassword) || '');
		const confirmPassword = String((req.body && req.body.confirmPassword) || '');

		if (!otp || !email || !newPassword || !confirmPassword) {
			return res.status(400).json({ message: 'Email, OTP, and password fields are required' });
		}

		if (!/^\d{6}$/.test(otp)) {
			return res.status(400).json({ message: 'OTP must be a 6-digit code' });
		}

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: 'Passwords do not match' });
		}

		const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
		if (!strongPasswordRegex.test(newPassword)) {
			return res.status(400).json({ message: 'Use 8+ characters with letters, numbers, and symbols' });
		}

		if (!activeMobileResetOtp || otp !== activeMobileResetOtp.otp) {
			return res.status(400).json({ message: 'Invalid OTP' });
		}

		if (email !== activeMobileResetOtp.email) {
			return res.status(400).json({ message: 'OTP does not match this email' });
		}

		if (Date.now() > activeMobileResetOtp.expiresAt) {
			activeMobileResetOtp = null;
			return res.status(400).json({ message: 'OTP has expired' });
		}

		const member = await MobileUser.findOne({ email }).lean();
		if (!member) {
			activeMobileResetOtp = null;
			return res.status(400).json({ message: 'Account is not eligible for password reset' });
		}

		const newPasswordHash = await bcrypt.hash(newPassword, 10);
		await MobileUser.updateOne({ _id: member._id }, { $set: { passwordHash: newPasswordHash } });

		activeMobileResetOtp = null;

		return res.status(200).json({ message: 'Password updated successfully' });
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to reset password' });
	}
});

app.get('/api/admin/member-notifications', requireAdminAuth, async (_req, res) => {
	try {
		const recentMembers = await MobileUser.find({})
			.select({ firstName: 1, lastName: 1, email: 1, createdAt: 1 })
			.sort({ createdAt: -1 })
			.limit(20)
			.lean();

		return res.status(200).json({
			items: recentMembers.map(toMemberNotificationItem).filter(Boolean),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load member notifications' });
	}
});

app.get('/api/admin/advertisements', requireAdminAuth, async (_req, res) => {
	try {
		const items = await Advertisement.find({})
			.sort({ displayOrder: 1, updatedAt: -1 })
			.lean();

		return res.status(200).json({
			items: items.map((item) => toAdvertisementResponseItemForRequest(item, _req)).filter(Boolean),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load advertisements' });
	}
});

app.post('/api/admin/advertisements', requireAdminAuth, async (req, res) => {
	try {
		const title = String((req.body && req.body.title) || '').trim();
		const subtitle = String((req.body && req.body.subtitle) || '').trim();
		const image = String((req.body && req.body.image) || '').trim();
		const displayOrder = Number((req.body && req.body.displayOrder) || 0);
		const isActive = (req.body && typeof req.body.isActive === 'boolean') ? req.body.isActive : true;

		if (!title || !image) {
			return res.status(400).json({ message: 'Title and image are required' });
		}

		const created = await Advertisement.create({
			title,
			subtitle,
			image,
			displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
			isActive,
		});

		return res.status(201).json({
			message: 'Advertisement created successfully',
			item: toAdvertisementResponseItemForRequest(created, req),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to create advertisement' });
	}
});

app.put('/api/admin/advertisements/:id', requireAdminAuth, async (req, res) => {
	try {
		const advertisementId = String(req.params.id || '').trim();
		if (!mongoose.isValidObjectId(advertisementId)) {
			return res.status(400).json({ message: 'Invalid advertisement id' });
		}

		const title = String((req.body && req.body.title) || '').trim();
		const subtitle = String((req.body && req.body.subtitle) || '').trim();
		const image = String((req.body && req.body.image) || '').trim();
		const displayOrder = Number((req.body && req.body.displayOrder) || 0);
		const isActive = (req.body && typeof req.body.isActive === 'boolean') ? req.body.isActive : true;

		if (!title || !image) {
			return res.status(400).json({ message: 'Title and image are required' });
		}

		const updated = await Advertisement.findByIdAndUpdate(
			advertisementId,
			{
				$set: {
					title,
					subtitle,
					image,
					displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
					isActive,
				},
			},
			{ new: true }
		).lean();

		if (!updated) {
			return res.status(404).json({ message: 'Advertisement not found' });
		}

		return res.status(200).json({
			message: 'Advertisement updated successfully',
			item: toAdvertisementResponseItemForRequest(updated, req),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to update advertisement' });
	}
});

app.delete('/api/admin/advertisements/:id', requireAdminAuth, async (req, res) => {
	try {
		const advertisementId = String(req.params.id || '').trim();
		if (!mongoose.isValidObjectId(advertisementId)) {
			return res.status(400).json({ message: 'Invalid advertisement id' });
		}

		const deleted = await Advertisement.findByIdAndDelete(advertisementId).lean();
		if (!deleted) {
			return res.status(404).json({ message: 'Advertisement not found' });
		}

		return res.status(200).json({
			message: 'Advertisement deleted successfully',
			item: toAdvertisementResponseItemForRequest(deleted, req),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to delete advertisement' });
	}
});

app.post('/api/members', requireAdminAuth, async (req, res) => {
	try {
		const firstName = String((req.body && req.body.firstName) || '').trim();
		const lastName = String((req.body && req.body.lastName) || '').trim();
		const email = String((req.body && req.body.email) || '').trim().toLowerCase();
		const gender = String((req.body && req.body.gender) || '').trim();
		const dobRaw = String((req.body && req.body.dob) || '').trim();
		const password = String((req.body && req.body.password) || '');
		const profileImage = String((req.body && req.body.profileImage) || '').trim();

		if (!firstName || !lastName || !email || !gender || !dobRaw || !password) {
			return res.status(400).json({
				message:
					'First name, last name, email, gender, date of birth, and password are required',
			});
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ message: 'Enter a valid email address' });
		}

		if (gender !== 'Male' && gender !== 'Female') {
			return res.status(400).json({ message: 'Gender must be Male or Female' });
		}

		const parsedDob = new Date(dobRaw);
		if (Number.isNaN(parsedDob.getTime())) {
			return res.status(400).json({ message: 'Date of birth is invalid' });
		}

		const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
		if (!strongPasswordRegex.test(password)) {
			return res.status(400).json({
				message: 'Use 8+ characters with letters, numbers, and symbols',
			});
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const createdMember = await MobileUser.create({
			firstName,
			lastName,
			email,
			passwordHash,
			gender,
			dateOfBirth: parsedDob,
			profileImage,
			membership: {
				status: 'active',
				activatedAt: new Date(),
			},
			payment: {
				admissionFee: 0,
				monthFee: 0,
				totalAmount: 0,
				currency: 'LKR',
				method: 'admin-manual',
				cardLast4: '',
				paidAt: new Date(),
				termsAccepted: true,
			},
		});

		return res.status(201).json({
			message: 'Member added successfully',
			item: toMobileMemberResponseItem(createdMember),
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({ message: 'An account with this email already exists' });
		}

		return res.status(500).json({ message: 'Failed to add member' });
	}
});

app.get('/api/members', requireAdminAuth, async (_req, res) => {
	try {
		const members = await MobileUser.find({}).sort({ createdAt: -1 }).lean();
		return res.status(200).json({
			items: members.map(toMobileMemberResponseItem).filter(Boolean),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load members' });
	}
});

app.get('/api/members/:id', requireAdminAuth, async (req, res) => {
	try {
		const memberId = String(req.params.id || '').trim();
		if (!mongoose.isValidObjectId(memberId)) {
			return res.status(400).json({ message: 'Invalid member id' });
		}

		const member = await MobileUser.findById(memberId).lean();
		if (!member) {
			return res.status(404).json({ message: 'Member not found' });
		}

		return res.status(200).json({ item: toMobileMemberResponseItem(member) });
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load member details' });
	}
});

app.put('/api/members/:id', requireAdminAuth, async (req, res) => {
	try {
		const memberId = String(req.params.id || '').trim();
		if (!mongoose.isValidObjectId(memberId)) {
			return res.status(400).json({ message: 'Invalid member id' });
		}

		const firstName = String((req.body && req.body.firstName) || '').trim();
		const lastName = String((req.body && req.body.lastName) || '').trim();
		const email = String((req.body && req.body.email) || '').trim().toLowerCase();
		const gender = String((req.body && req.body.gender) || '').trim();
		const dobRaw = String((req.body && req.body.dob) || '').trim();
		const profileImage = String((req.body && req.body.profileImage) || '').trim();

		if (!firstName || !lastName || !email || !gender || !dobRaw) {
			return res.status(400).json({ message: 'First name, last name, email, gender, and date of birth are required' });
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ message: 'Enter a valid email address' });
		}

		if (gender !== 'Male' && gender !== 'Female') {
			return res.status(400).json({ message: 'Gender must be Male or Female' });
		}

		const parsedDob = new Date(dobRaw);
		if (Number.isNaN(parsedDob.getTime())) {
			return res.status(400).json({ message: 'Date of birth is invalid' });
		}

		const updatedMember = await MobileUser.findByIdAndUpdate(
			memberId,
			{
				$set: {
					firstName,
					lastName,
					email,
					gender,
					dateOfBirth: parsedDob,
					...(profileImage ? { profileImage } : {}),
				},
			},
			{ new: true, runValidators: true }
		).lean();

		if (!updatedMember) {
			return res.status(404).json({ message: 'Member not found' });
		}

		return res.status(200).json({
			message: 'Member updated successfully',
			item: toMobileMemberResponseItem(updatedMember),
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({ message: 'An account with this email already exists' });
		}

		return res.status(500).json({ message: 'Failed to update member' });
	}
});

app.delete('/api/members/:id', requireAdminAuth, async (req, res) => {
	try {
		const memberId = String(req.params.id || '').trim();
		if (!mongoose.isValidObjectId(memberId)) {
			return res.status(400).json({ message: 'Invalid member id' });
		}

		const deletedMember = await MobileUser.findByIdAndDelete(memberId).lean();
		if (!deletedMember) {
			return res.status(404).json({ message: 'Member not found' });
		}

		return res.status(200).json({ message: 'Member deleted successfully' });
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to delete member' });
	}
});

app.post('/api/access-requests', async (req, res) => {
	try {
		if (!accessRequestStore) {
			return res.status(503).json({ message: 'Access request store is not ready' });
		}

		const { userName, email, password } = req.body || {};

		if (!userName || !email || !password) {
			return res
				.status(400)
				.json({ message: 'Username, email, and password are required' });
		}

		const normalizedUserName = String(userName).trim().toLowerCase();
		const normalizedEmail = String(email).trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			return res.status(400).json({ message: 'Enter a valid email address' });
		}

		const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
		if (!strongPasswordRegex.test(password)) {
			return res.status(400).json({
				message: 'Use 8+ characters with letters, numbers, and symbols',
			});
		}

		const existingRequest = await accessRequestStore.findActiveByUserOrEmail(
			normalizedUserName,
			normalizedEmail
		);

		if (existingRequest) {
			return res.status(409).json({
				message: 'This username or email already has an active request/account',
			});
		}

		const passwordHash = await bcrypt.hash(String(password), 10);

		await accessRequestStore.createPending({
			userName: normalizedUserName,
			email: normalizedEmail,
			passwordHash,
		});

		return res.status(201).json({
			message: 'Access request submitted. Waiting for admin approval.',
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({
				message: 'This username or email already has an active request/account',
			});
		}

		return res.status(500).json({ message: 'Failed to submit access request' });
	}
});

app.get('/api/access-requests/pending', requireAdminAuth, async (_req, res) => {
	try {
		if (!accessRequestStore) {
			return res.status(503).json({ message: 'Access request store is not ready' });
		}

		const pendingRequests = await accessRequestStore.listPending();
		const items = pendingRequests.map(toResponseItem);

		return res.status(200).json({ items });
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load pending requests' });
	}
});

app.patch('/api/access-requests/:id/review', requireAdminAuth, async (req, res) => {
	try {
		if (!accessRequestStore) {
			return res.status(503).json({ message: 'Access request store is not ready' });
		}

		const { id } = req.params;
		const { action, reason } = req.body || {};

		if (!action || !['approve', 'reject'].includes(action)) {
			return res.status(400).json({ message: 'Action must be approve or reject' });
		}

		const requestItem = await accessRequestStore.findById(id);
		if (!requestItem) {
			return res.status(404).json({ message: 'Request not found' });
		}

		if (requestItem.status !== 'pending') {
			return res.status(400).json({ message: 'Only pending requests can be reviewed' });
		}

		const updatedRequest = await accessRequestStore.review({
			id,
			status: action === 'approve' ? 'approved' : 'rejected',
			reviewedBy: req.admin.userName || adminUserName,
			rejectReason: action === 'reject' ? String(reason || '').trim() : '',
		});

		if (!updatedRequest) {
			return res.status(400).json({ message: 'Only pending requests can be reviewed' });
		}

		const emailResult = await sendAccessReviewEmail({
			to: updatedRequest.email,
			userName: updatedRequest.userName,
			action,
			rejectReason: updatedRequest.rejectReason,
			reviewedBy: req.admin.userName || adminUserName,
		});

		return res.status(200).json({
			message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
			emailSent: emailResult.sent,
			emailStatus: emailResult.reason || 'sent',
			item: toResponseItem(updatedRequest),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to review request' });
	}
});

app.get('/api/trainers', requireAdminAuth, async (_req, res) => {
	try {
		const trainers = await Trainer.find({}).sort({ createdAt: -1 }).lean();
		return res.status(200).json({
			items: trainers.map(toTrainerResponseItem),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load trainers' });
	}
});

app.post('/api/trainers', requireAdminAuth, async (req, res) => {
	try {
		const {
			trainerId,
			firstName,
			lastName,
			email,
			gender,
			dob,
			status,
			profileImage,
		} = req.body || {};

		if (!trainerId || !firstName || !lastName || !email || !gender || !dob) {
			return res.status(400).json({
				message: 'Trainer ID, first name, last name, email, gender, and date of birth are required',
			});
		}

		const normalizedTrainerId = String(trainerId).trim().toUpperCase();
		const normalizedFirstName = String(firstName).trim();
		const normalizedLastName = String(lastName).trim();
		const normalizedEmail = String(email).trim().toLowerCase();
		const normalizedGender = String(gender).trim();
		const dobDate = new Date(dob);

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			return res.status(400).json({ message: 'Enter a valid email address' });
		}

		if (!['Male', 'Female'].includes(normalizedGender)) {
			return res.status(400).json({ message: 'Gender must be Male or Female' });
		}

		if (Number.isNaN(dobDate.getTime())) {
			return res.status(400).json({ message: 'Date of birth is invalid' });
		}

		const calculatedAge = calculateAgeFromDate(dobDate);
		if (!Number.isInteger(calculatedAge) || calculatedAge < 16 || calculatedAge > 100) {
			return res.status(400).json({
				message: 'Age calculated from date of birth must be between 16 and 100',
			});
		}

		const existingTrainer = await Trainer.findOne({
			$or: [{ trainerId: normalizedTrainerId }, { email: normalizedEmail }],
		}).lean();

		if (existingTrainer) {
			return res.status(409).json({
				message: 'Trainer ID or email already exists',
			});
		}

		const created = await Trainer.create({
			trainerId: normalizedTrainerId,
			firstName: normalizedFirstName,
			lastName: normalizedLastName,
			email: normalizedEmail,
			gender: normalizedGender,
			age: calculatedAge,
			dob: dobDate,
			status: status === 'Inactive' ? 'Inactive' : 'Active',
			profileImage: String(profileImage || '').trim() || trainerImageFallback,
		});

		return res.status(201).json({
			message: 'Trainer created successfully',
			item: toTrainerResponseItem(created.toObject()),
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({ message: 'Trainer ID or email already exists' });
		}

		return res.status(500).json({ message: 'Failed to create trainer' });
	}
});

app.put('/api/trainers/:trainerId', requireAdminAuth, async (req, res) => {
	try {
		const routeTrainerId = String(req.params.trainerId || '').trim().toUpperCase();
		const {
			firstName,
			lastName,
			email,
			gender,
			dob,
			status,
			profileImage,
		} = req.body || {};

		if (!routeTrainerId || !firstName || !lastName || !email || !gender || !dob) {
			return res.status(400).json({
				message: 'Trainer ID, first name, last name, email, gender, and date of birth are required',
			});
		}

		const normalizedFirstName = String(firstName).trim();
		const normalizedLastName = String(lastName).trim();
		const normalizedEmail = String(email).trim().toLowerCase();
		const normalizedGender = String(gender).trim();
		const dobDate = new Date(dob);

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			return res.status(400).json({ message: 'Enter a valid email address' });
		}

		if (!['Male', 'Female'].includes(normalizedGender)) {
			return res.status(400).json({ message: 'Gender must be Male or Female' });
		}

		if (Number.isNaN(dobDate.getTime())) {
			return res.status(400).json({ message: 'Date of birth is invalid' });
		}

		const calculatedAge = calculateAgeFromDate(dobDate);
		if (!Number.isInteger(calculatedAge) || calculatedAge < 16 || calculatedAge > 100) {
			return res.status(400).json({
				message: 'Age calculated from date of birth must be between 16 and 100',
			});
		}

		const existingTrainer = await Trainer.findOne({ trainerId: routeTrainerId }).lean();
		if (!existingTrainer) {
			return res.status(404).json({ message: 'Trainer not found' });
		}

		const duplicateEmailTrainer = await Trainer.findOne({
			email: normalizedEmail,
			trainerId: { $ne: routeTrainerId },
		}).lean();

		if (duplicateEmailTrainer) {
			return res.status(409).json({ message: 'Email already exists' });
		}

		const updated = await Trainer.findOneAndUpdate(
			{ trainerId: routeTrainerId },
			{
				$set: {
					firstName: normalizedFirstName,
					lastName: normalizedLastName,
					email: normalizedEmail,
					gender: normalizedGender,
					age: calculatedAge,
					dob: dobDate,
					status: status === 'Inactive' ? 'Inactive' : 'Active',
					profileImage: String(profileImage || '').trim() || trainerImageFallback,
				},
			},
			{ new: true }
		);

		return res.status(200).json({
			message: 'Trainer updated successfully',
			item: toTrainerResponseItem(updated && updated.toObject ? updated.toObject() : updated),
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(409).json({ message: 'Trainer email already exists' });
		}

		return res.status(500).json({ message: 'Failed to update trainer' });
	}
});

app.delete('/api/trainers/:trainerId', requireAdminAuth, async (req, res) => {
	try {
		const routeTrainerId = String(req.params.trainerId || '').trim().toUpperCase();
		if (!routeTrainerId) {
			return res.status(400).json({ message: 'Trainer ID is required' });
		}

		const deleted = await Trainer.findOneAndDelete({ trainerId: routeTrainerId }).lean();
		if (!deleted) {
			return res.status(404).json({ message: 'Trainer not found' });
		}

		return res.status(200).json({
			message: 'Trainer deleted successfully',
			item: toTrainerResponseItem(deleted),
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to delete trainer' });
	}
});

app.get('/api/profile', requireAdminAuth, async (req, res) => {
	try {
		const normalizedUserName = String((req.admin && req.admin.userName) || '')
			.trim()
			.toLowerCase();

		if (!normalizedUserName) {
			return res.status(400).json({ message: 'User name is required' });
		}

		const existingProfile = await Profile.findOne({ userName: normalizedUserName }).lean();

		return res.status(200).json({
			item: {
				userName: normalizedUserName,
				displayName:
					String((existingProfile && existingProfile.displayName) || '').trim() ||
					(req.admin && req.admin.userName) ||
					normalizedUserName,
				profileImage: String((existingProfile && existingProfile.profileImage) || '').trim(),
			},
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to load profile' });
	}
});

app.put('/api/profile/image', requireAdminAuth, async (req, res) => {
	try {
		const normalizedUserName = String((req.admin && req.admin.userName) || '')
			.trim()
			.toLowerCase();
		const { profileImage } = req.body || {};
		const normalizedImage = String(profileImage || '').trim();

		if (!normalizedUserName) {
			return res.status(400).json({ message: 'User name is required' });
		}

		if (!normalizedImage) {
			return res.status(400).json({ message: 'Profile image is required' });
		}

		if (!normalizedImage.startsWith('data:image/')) {
			return res.status(400).json({ message: 'Profile image format is invalid' });
		}

		if (normalizedImage.length > 8 * 1024 * 1024) {
			return res.status(413).json({ message: 'Profile image is too large' });
		}

		const updatedProfile = await Profile.findOneAndUpdate(
			{ userName: normalizedUserName },
			{
				$set: {
					userName: normalizedUserName,
					displayName: (req.admin && req.admin.userName) || normalizedUserName,
					profileImage: normalizedImage,
				},
			},
			{ new: true, upsert: true }
		).lean();

		return res.status(200).json({
			message: 'Profile image updated successfully',
			item: {
				userName: updatedProfile.userName,
				displayName: updatedProfile.displayName,
				profileImage: updatedProfile.profileImage,
			},
		});
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to update profile image' });
	}
});

app.post('/api/auth/login', async (req, res) => {
	try {
		const { userName, password } = req.body || {};

		if (!userName || !password) {
			return res.status(400).json({ message: 'Username and password are required' });
		}

		const normalizedUserName = String(userName).trim().toLowerCase();
		const normalizedAdminUserName = String(adminUserName).trim().toLowerCase();

		let authenticatedUserName = '';
		let isPasswordValid = false;

		if (normalizedUserName === normalizedAdminUserName) {
			isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
			authenticatedUserName = adminUserName;
		} else if (accessRequestStore && typeof accessRequestStore.findApprovedByUserName === 'function') {
			const approvedUser = await accessRequestStore.findApprovedByUserName(normalizedUserName);
			if (approvedUser) {
				isPasswordValid = await bcrypt.compare(password, approvedUser.passwordHash || '');
				authenticatedUserName = approvedUser.userName;
			}
		}

		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Invalid username or password' });
		}

		const token = jwt.sign(
			{
				sub: `admin-${authenticatedUserName}`,
				role: 'admin',
				userName: authenticatedUserName,
			},
			jwtSecret,
			{ expiresIn: tokenExpiry }
		);

		return res.status(200).json({
			token,
			admin: {
				userName: authenticatedUserName,
				role: 'admin',
			},
		});
	} catch (error) {
		return res.status(500).json({ message: 'Login failed. Please try again.' });
	}
});

app.post('/api/auth/forgot-password', async (req, res) => {
	try {
		const { userName } = req.body || {};

		if (!userName || !String(userName).trim()) {
			return res.status(400).json({ message: 'Username is required' });
		}

		const normalizedUserName = String(userName).trim().toLowerCase();
		const normalizedAdminUserName = String(adminUserName).trim().toLowerCase();
		const isAdminUser = normalizedUserName === normalizedAdminUserName;
		const genericMessage =
			'If the account exists, a reset token has been generated for password reset.';

		let targetAccountType = '';
		let targetUserName = '';

		if (isAdminUser) {
			targetAccountType = 'main-admin';
			targetUserName = adminUserName;
		} else if (accessRequestStore && typeof accessRequestStore.findApprovedByUserName === 'function') {
			const approvedUser = await accessRequestStore.findApprovedByUserName(normalizedUserName);
			if (approvedUser) {
				targetAccountType = 'approved-admin';
				targetUserName = approvedUser.userName;
			}
		}

		if (!targetAccountType) {
			return res.status(200).json({ message: genericMessage });
		}

		const resetToken = crypto.randomBytes(24).toString('hex');
		const expiresAt = Date.now() + resetTokenExpiryMinutes * 60 * 1000;

		activeResetToken = {
			token: resetToken,
			userName: targetUserName,
			accountType: targetAccountType,
			expiresAt,
		};

		const response = {
			message: genericMessage,
		};

		// Return token only for local development testing.
		if (process.env.NODE_ENV !== 'production') {
			response.resetToken = resetToken;
			response.expiresInMinutes = resetTokenExpiryMinutes;
		}

		return res.status(200).json(response);
	} catch (_error) {
		return res.status(500).json({ message: 'Unable to process forgot password request' });
	}
});

app.post('/api/auth/reset-password', async (req, res) => {
	try {
		const { token, newPassword, confirmPassword } = req.body || {};

		if (!token || !newPassword || !confirmPassword) {
			return res.status(400).json({ message: 'Token and password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: 'Passwords do not match' });
		}

		const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
		if (!strongPasswordRegex.test(newPassword)) {
			return res.status(400).json({
				message: 'Use 8+ characters with letters, numbers, and symbols',
			});
		}

		if (!activeResetToken || token !== activeResetToken.token) {
			return res.status(400).json({ message: 'Invalid reset token' });
		}

		if (Date.now() > activeResetToken.expiresAt) {
			activeResetToken = null;
			return res.status(400).json({ message: 'Reset token has expired' });
		}

		const newPasswordHash = await bcrypt.hash(newPassword, 10);

		if (activeResetToken.accountType === 'main-admin') {
			adminPasswordHash = newPasswordHash;
		} else if (activeResetToken.accountType === 'approved-admin') {
			if (!accessRequestStore || typeof accessRequestStore.updatePasswordByUserName !== 'function') {
				return res.status(500).json({ message: 'Password store is not ready' });
			}

			const updatedUser = await accessRequestStore.updatePasswordByUserName(
				activeResetToken.userName,
				newPasswordHash
			);

			if (!updatedUser) {
				return res.status(400).json({ message: 'Account is not eligible for password reset' });
			}
		} else {
			return res.status(400).json({ message: 'Invalid reset token' });
		}

		activeResetToken = null;

		return res.status(200).json({ message: 'Password updated successfully' });
	} catch (_error) {
		return res.status(500).json({ message: 'Failed to reset password' });
	}
});

app.get('/api/auth/verify', (req, res) => {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

		if (!token) {
			return res.status(401).json({ message: 'Missing token' });
		}

		const decoded = jwt.verify(token, jwtSecret);
		return res.status(200).json({
			valid: true,
			admin: {
				userName: decoded.userName,
				role: decoded.role,
			},
		});
	} catch (_error) {
		return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
	}
});

async function startServer() {
	try {
		if (accessReviewMailEnabled) {
			if (isMailConfigured()) {
				try {
					await getMailTransporter().verify();
					console.log('Access review email: enabled');
				} catch (mailError) {
					console.warn(
						`Access review email: SMTP verification failed (${mailError.message}). Decision emails will not be sent until fixed.`
					);
				}
			} else {
				console.warn(
					'Access review email: enabled but SMTP settings are incomplete. Decision emails will not be sent.'
				);
			}
		} else {
			console.log('Access review email: disabled');
		}

		await mongoose.connect(mongoUri);
		console.log('MongoDB connected');

		await seedDefaultAdvertisementsIfEmpty();

		accessRequestStore = await initializeAccessRequestStore();

		app.listen(port, () => {
			console.log(`Backend running on http://localhost:${port}`);
		});
	} catch (error) {
		if (!allowStartWithoutMongo) {
			console.error('Failed to connect MongoDB', error.message);
			process.exit(1);
			return;
		}

		console.warn('MongoDB unavailable. Starting in fallback mode without MongoDB.');
		console.warn('Set ALLOW_START_WITHOUT_MONGO=false to enforce MongoDB startup.');

		if (accessRequestDbMode !== 'sqlite') {
			console.warn(
				'ACCESS_REQUEST_DB is not sqlite. Access request endpoints may not work until MongoDB is available.'
			);
		} else {
			try {
				accessRequestStore = await initializeAccessRequestStore();
			} catch (storeError) {
				console.warn('Failed to initialize access request store:', storeError.message);
			}
		}

		app.listen(port, () => {
			console.log(`Backend running on http://localhost:${port} (fallback mode)`);
		});
	}
}

startServer();

app.use((error, _req, res, _next) => {
	if (error && error.type === 'entity.too.large') {
		return res.status(413).json({
			message: 'Selected image is too large. Please choose a smaller image.',
		});
	}

	return res.status(500).json({ message: 'Unexpected server error' });
});

