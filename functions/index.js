const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// --- NEON POSTGRESQL CONFIG ---
const DATABASE_URL = "postgresql://neondb_owner:npg_nZ5tUsL2zVGq@ep-rapid-thunder-aiq4uiba-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Helper to initialize tables
const initTables = async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                uid TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                phone_number TEXT,
                phone_locked BOOLEAN DEFAULT FALSE,
                coins INTEGER DEFAULT 0,
                total_earned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS otps (
                email TEXT PRIMARY KEY,
                otp_hash TEXT,
                expiry BIGINT,
                phone_number TEXT,
                is_signup BOOLEAN
            );

            CREATE TABLE IF NOT EXISTS withdrawals (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(uid),
                coins INTEGER,
                usd_amount NUMERIC(10,2),
                status TEXT DEFAULT 'pending',
                phone_number TEXT,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Table initialization failed:", err);
        throw err;
    } finally {
        if (client) client.release();
    }
};

// --- EMAIL CONFIG ---
const GMAIL_USER = functions.config().gmail ? functions.config().gmail.user : "your-email@gmail.com";
const GMAIL_PASS = functions.config().gmail ? functions.config().gmail.pass : "your-app-password";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Request OTP
exports.requestOTP = functions.https.onCall(async (data, context) => {
    // onCall functions handle CORS automatically, but the "Response to preflight" error
    // usually indicates a cold-start timeout or a crash BEFORE the response is sent.

    const { email, phoneNumber, isSignup } = data;
    console.log(`Requesting OTP for ${email}, isSignup: ${isSignup}`);

    if (!email) throw new functions.https.HttpsError('invalid-argument', 'Email is required.');

    try {
        await initTables();

        if (isSignup) {
            if (!phoneNumber) throw new functions.https.HttpsError('invalid-argument', 'Phone required for signup.');
            const userExists = await admin.auth().getUserByEmail(email).catch(() => null);
            if (userExists) throw new functions.https.HttpsError('already-exists', 'User exists. Login instead.');
        }

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiry = Date.now() + 5 * 60 * 1000;

        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO otps (email, otp_hash, expiry, phone_number, is_signup) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (email) DO UPDATE SET otp_hash = $2, expiry = $3, phone_number = $4, is_signup = $5`,
                [email, otpHash, expiry, phoneNumber || null, isSignup]
            );

            await transporter.sendMail({
                from: `"EarnRewardzz" <${GMAIL_USER}>`,
                to: email,
                subject: "Your OTP Code",
                text: `Your EarnRewardzz code is: ${otp}. Valid for 5 minutes.`
            });
            return { success: true };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in requestOTP:", error);
        // We re-throw as HttpsError so the client receives a structured error instead of a crash
        throw new functions.https.HttpsError('internal', error.message || 'OTP delivery failed.');
    }
});

// 2. Verify OTP
exports.verifyOTP = functions.https.onCall(async (data, context) => {
    const { email, otp } = data;
    if (!email || !otp) throw new functions.https.HttpsError('invalid-argument', 'Missing fields.');

    try {
        await initTables();
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT * FROM otps WHERE email = $1", [email]);
            if (res.rows.length === 0) throw new functions.https.HttpsError('not-found', 'OTP not requested.');

            const { otp_hash, expiry, phone_number, is_signup } = res.rows[0];

            if (Date.now() > expiry) {
                await client.query("DELETE FROM otps WHERE email = $1", [email]);
                throw new functions.https.HttpsError('deadline-exceeded', 'OTP expired.');
            }

            const isValid = await bcrypt.compare(otp, otp_hash);
            if (!isValid) throw new functions.https.HttpsError('permission-denied', 'Invalid OTP.');

            await client.query("DELETE FROM otps WHERE email = $1", [email]);

            let uid;
            if (is_signup) {
                const user = await admin.auth().createUser({ email, emailVerified: true });
                uid = user.uid;
                await client.query(
                    "INSERT INTO users (uid, email, phone_number, phone_locked) VALUES ($1, $2, $3, $4)",
                    [uid, email, phone_number, true]
                );
            } else {
                const user = await admin.auth().getUserByEmail(email);
                uid = user.uid;
                await client.query(
                    "INSERT INTO users (uid, email) VALUES ($1, $2) ON CONFLICT (uid) DO NOTHING",
                    [uid, email]
                );
            }

            const customToken = await admin.auth().createCustomToken(uid);
            return { success: true, token: customToken };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 3. Claim Reward
exports.claimReward = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const { uid } = context.auth;

    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const userRes = await client.query("SELECT coins, total_earned FROM users WHERE uid = $1 FOR UPDATE", [uid]);
            if (userRes.rows.length === 0) throw new Error("User missing in database.");

            await client.query(
                "UPDATE users SET coins = coins + 1, total_earned = total_earned + 1 WHERE uid = $1",
                [uid]
            );

            await client.query("COMMIT");
            return { success: true };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in claimReward:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 4. Request Withdrawal
exports.requestWithdrawal = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const { amount } = data;
    const { uid } = context.auth;

    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const userRes = await client.query("SELECT * FROM users WHERE uid = $1 FOR UPDATE", [uid]);
            const user = userRes.rows[0];

            if (!user.phone_locked) throw new Error("Lock your phone first.");
            if (user.coins < amount) throw new Error("Insufficient balance.");

            await client.query("UPDATE users SET coins = coins - $1 WHERE uid = $2", [amount, uid]);
            await client.query(
                "INSERT INTO withdrawals (user_id, coins, usd_amount, phone_number, email) VALUES ($1, $2, $3, $4, $5)",
                [uid, amount, amount / 500, user.phone_number, user.email]
            );

            await client.query("COMMIT");
            return { success: true };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in requestWithdrawal:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 5. Get User Data
exports.getUserData = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const { uid } = context.auth;

    try {
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT * FROM users WHERE uid = $1", [uid]);
            if (res.rows.length === 0) return { success: false, message: "User not found" };
            return { success: true, userData: res.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in getUserData:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
