import { safeJsonParse } from '../utils/validation.js';

function toMySqlDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isVerified: Boolean(row.is_verified),
    verificationOtp: row.verification_otp || null,
    otpExpiresAt: row.otp_expires_at || null,
    resetOtp: row.reset_otp || null,
    resetOtpExpiresAt: row.reset_otp_expires_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCode(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    title: row.title,
    code: row.code,
    language: row.language,
    dsaPattern: row.dsa_pattern,
    tags: safeJsonParse(row.tags_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTestCase(row) {
  return {
    id: Number(row.id),
    savedCodeId: Number(row.saved_code_id),
    label: row.label,
    input: safeJsonParse(row.input_json, {}),
    expected: safeJsonParse(row.expected_json, null),
    createdAt: row.created_at,
  };
}

function mapVisualization(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    savedCodeId: row.saved_code_id ? Number(row.saved_code_id) : null,
    pattern: row.pattern,
    input: safeJsonParse(row.input_json, {}),
    steps: safeJsonParse(row.steps_json, []),
    createdAt: row.created_at,
  };
}

function mapExecution(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    savedCodeId: row.saved_code_id ? Number(row.saved_code_id) : null,
    language: row.language,
    patternDetected: row.pattern_detected,
    input: safeJsonParse(row.input_json, {}),
    output: safeJsonParse(row.output_json, null),
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

async function fetchTestCases(pool, codeIds) {
  if (!codeIds.length) return new Map();
  const [rows] = await pool.query('SELECT * FROM test_cases WHERE saved_code_id IN (?) ORDER BY created_at DESC', [codeIds]);
  const map = new Map();
  for (const row of rows) {
    const testCase = mapTestCase(row);
    const list = map.get(testCase.savedCodeId) || [];
    list.push(testCase);
    map.set(testCase.savedCodeId, list);
  }
  return map;
}

export function createMySqlRepositories(pool) {
  const codesRepo = {
    async create(userId, payload) {
      const [result] = await pool.execute(
        'INSERT INTO saved_codes (user_id, title, code, language, dsa_pattern, tags_json) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, payload.title, payload.code, payload.language, payload.dsaPattern, JSON.stringify(payload.tags || [])],
      );
      const codeId = Number(result.insertId);
      for (const testCase of payload.testCases || []) {
        await pool.execute(
          'INSERT INTO test_cases (saved_code_id, label, input_json, expected_json) VALUES (?, ?, ?, ?)',
          [codeId, testCase.label, JSON.stringify(testCase.input ?? {}), JSON.stringify(testCase.expected ?? null)],
        );
      }
      return this.getByIdForUser(userId, codeId);
    },
    async listByUser(userId) {
      const [rows] = await pool.execute('SELECT * FROM saved_codes WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
      const codes = rows.map(mapCode);
      const testCasesByCode = await fetchTestCases(pool, codes.map((item) => item.id));
      return codes.map((code) => ({ ...code, testCases: testCasesByCode.get(code.id) || [] }));
    },
    async getByIdForUser(userId, codeId) {
      const [rows] = await pool.execute('SELECT * FROM saved_codes WHERE id = ? AND user_id = ? LIMIT 1', [codeId, userId]);
      if (!rows.length) return null;
      const code = mapCode(rows[0]);
      const testCasesByCode = await fetchTestCases(pool, [code.id]);
      return { ...code, testCases: testCasesByCode.get(code.id) || [] };
    },
    async update(userId, codeId, payload) {
      const existing = await this.getByIdForUser(userId, codeId);
      if (!existing) return null;
      await pool.execute(
        'UPDATE saved_codes SET title = ?, code = ?, language = ?, dsa_pattern = ?, tags_json = ? WHERE id = ? AND user_id = ?',
        [
          payload.title ?? existing.title,
          payload.code ?? existing.code,
          payload.language ?? existing.language,
          payload.dsaPattern ?? existing.dsaPattern,
          JSON.stringify(payload.tags ?? existing.tags),
          codeId,
          userId,
        ],
      );
      if (payload.testCases) {
        await pool.execute('DELETE FROM test_cases WHERE saved_code_id = ?', [codeId]);
        for (const testCase of payload.testCases) {
          await pool.execute(
            'INSERT INTO test_cases (saved_code_id, label, input_json, expected_json) VALUES (?, ?, ?, ?)',
            [codeId, testCase.label, JSON.stringify(testCase.input ?? {}), JSON.stringify(testCase.expected ?? null)],
          );
        }
      }
      return this.getByIdForUser(userId, codeId);
    },
    async remove(userId, codeId) {
      const [result] = await pool.execute('DELETE FROM saved_codes WHERE id = ? AND user_id = ?', [codeId, userId]);
      return result.affectedRows > 0;
    },
  };

  return {
    async health() {
      await pool.query('SELECT 1');
      return { mode: 'mysql' };
    },
    users: {
      async create({ name, email, passwordHash, verificationOtp, otpExpiresAt }) {
        const [result] = await pool.execute(
          'INSERT INTO users (name, email, password_hash, verification_otp, otp_expires_at) VALUES (?, ?, ?, ?, ?)',
          [name, email, passwordHash, verificationOtp || null, toMySqlDateTime(otpExpiresAt)],
        );
        return this.findById(Number(result.insertId));
      },
      async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        return mapUser(rows[0]);
      },
      async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        return mapUser(rows[0]);
      },
      async verifyEmail(email, otp) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        if (user.verificationOtp !== otp) return null;
        if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) return null;
        await pool.execute(
          'UPDATE users SET is_verified = TRUE, verification_otp = NULL, otp_expires_at = NULL WHERE email = ?',
          [email],
        );
        return this.findByEmail(email);
      },
      async updateOtp(email, otp, expiresAt) {
        const [result] = await pool.execute(
          'UPDATE users SET verification_otp = ?, otp_expires_at = ? WHERE email = ?',
          [otp, toMySqlDateTime(expiresAt), email],
        );
        return result.affectedRows > 0 ? this.findByEmail(email) : null;
      },
      async updateResetOtp(email, otp, expiresAt) {
        const [result] = await pool.execute(
          'UPDATE users SET reset_otp = ?, reset_otp_expires_at = ? WHERE email = ?',
          [otp, toMySqlDateTime(expiresAt), email],
        );
        return result.affectedRows > 0 ? this.findByEmail(email) : null;
      },
      async resetPassword(email, otp, newPasswordHash) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        if (user.resetOtp !== otp) return null;
        if (user.resetOtpExpiresAt && new Date(user.resetOtpExpiresAt) < new Date()) return null;
        await pool.execute(
          'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires_at = NULL WHERE email = ?',
          [newPasswordHash, email],
        );
        return this.findByEmail(email);
      },
    },
    codes: codesRepo,
    visualizations: {
      async create(userId, payload) {
        const [result] = await pool.execute(
          'INSERT INTO visualizations (user_id, saved_code_id, pattern, input_json, steps_json) VALUES (?, ?, ?, ?, ?)',
          [userId, payload.savedCodeId ?? null, payload.pattern, JSON.stringify(payload.input ?? {}), JSON.stringify(payload.steps ?? [])],
        );
        return this.getByIdForUser(userId, Number(result.insertId));
      },
      async listByUser(userId) {
        const [rows] = await pool.execute('SELECT * FROM visualizations WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows.map(mapVisualization);
      },
      async getByIdForUser(userId, visualizationId) {
        const [rows] = await pool.execute('SELECT * FROM visualizations WHERE id = ? AND user_id = ? LIMIT 1', [visualizationId, userId]);
        return rows.length ? mapVisualization(rows[0]) : null;
      },
    },
    executions: {
      async create(userId, payload) {
        const [result] = await pool.execute(
          'INSERT INTO execution_logs (user_id, saved_code_id, language, pattern_detected, input_json, output_json, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            payload.savedCodeId ?? null,
            payload.language,
            payload.patternDetected,
            JSON.stringify(payload.input ?? {}),
            JSON.stringify(payload.output ?? null),
            payload.status,
            payload.errorMessage ?? null,
          ],
        );
        return this.getByIdForUser(userId, Number(result.insertId));
      },
      async listByUser(userId) {
        const [rows] = await pool.execute('SELECT * FROM execution_logs WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows.map(mapExecution);
      },
      async getByIdForUser(userId, executionId) {
        const [rows] = await pool.execute('SELECT * FROM execution_logs WHERE id = ? AND user_id = ? LIMIT 1', [executionId, userId]);
        return rows.length ? mapExecution(rows[0]) : null;
      },
    },
    progress: {
      async getSummary(userId) {
        const [codeRows] = await pool.execute('SELECT dsa_pattern FROM saved_codes WHERE user_id = ?', [userId]);
        const [executionRows] = await pool.execute('SELECT COUNT(*) AS count FROM execution_logs WHERE user_id = ?', [userId]);
        const [visualizationRows] = await pool.execute('SELECT COUNT(*) AS count FROM visualizations WHERE user_id = ?', [userId]);
        const patternCounts = codeRows.reduce((acc, item) => {
          acc[item.dsa_pattern] = (acc[item.dsa_pattern] || 0) + 1;
          return acc;
        }, {});
        const mostUsedPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        return {
          savedCodes: codeRows.length,
          executionCount: Number(executionRows[0]?.count || 0),
          visualizationCount: Number(visualizationRows[0]?.count || 0),
          mostUsedPattern,
        };
      },
      async getDashboard(userId) {
        return {
          summary: await this.getSummary(userId),
          recentCodes: (await codesRepo.listByUser(userId)).slice(0, 5),
          recentExecutions: (await this._executions.listByUser(userId)).slice(0, 5),
          recentVisualizations: (await this._visualizations.listByUser(userId)).slice(0, 5),
        };
      },
      _executions: null,
      _visualizations: null,
    },
  };
}
