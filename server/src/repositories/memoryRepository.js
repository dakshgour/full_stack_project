function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function attachTestCases(code, testCases) {
  return { ...code, testCases: testCases.filter((item) => item.savedCodeId === code.id).map(clone) };
}

export function createMemoryRepositories() {
  const state = {
    users: [],
    codes: [],
    visualizations: [],
    executions: [],
    testCases: [],
    nextIds: { users: 1, codes: 1, visualizations: 1, executions: 1, testCases: 1 },
  };

  return {
    async health() {
      return { mode: 'memory' };
    },
    users: {
      async create({ name, email, passwordHash, verificationOtp, otpExpiresAt }) {
        const user = {
          id: state.nextIds.users++,
          name,
          email,
          passwordHash,
          isVerified: false,
          verificationOtp: verificationOtp || null,
          otpExpiresAt: otpExpiresAt || null,
          resetOtp: null,
          resetOtpExpiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.users.push(user);
        return clone(user);
      },
      async findByEmail(email) {
        return clone(state.users.find((user) => user.email === email) || null);
      },
      async findById(id) {
        return clone(state.users.find((user) => user.id === Number(id)) || null);
      },
      async verifyEmail(email, otp) {
        const user = state.users.find((u) => u.email === email);
        if (!user) return null;
        if (user.verificationOtp !== otp) return null;
        if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) return null;
        user.isVerified = true;
        user.verificationOtp = null;
        user.otpExpiresAt = null;
        user.updatedAt = new Date().toISOString();
        return clone(user);
      },
      async updateOtp(email, otp, expiresAt) {
        const user = state.users.find((u) => u.email === email);
        if (!user) return null;
        user.verificationOtp = otp;
        user.otpExpiresAt = expiresAt;
        user.updatedAt = new Date().toISOString();
        return clone(user);
      },
      async updateResetOtp(email, otp, expiresAt) {
        const user = state.users.find((u) => u.email === email);
        if (!user) return null;
        user.resetOtp = otp;
        user.resetOtpExpiresAt = expiresAt;
        user.updatedAt = new Date().toISOString();
        return clone(user);
      },
      async resetPassword(email, otp, newPasswordHash) {
        const user = state.users.find((u) => u.email === email);
        if (!user) return null;
        if (user.resetOtp !== otp) return null;
        if (user.resetOtpExpiresAt && new Date(user.resetOtpExpiresAt) < new Date()) return null;
        user.passwordHash = newPasswordHash;
        user.resetOtp = null;
        user.resetOtpExpiresAt = null;
        user.updatedAt = new Date().toISOString();
        return clone(user);
      },
    },
    codes: {
      async create(userId, payload) {
        const code = {
          id: state.nextIds.codes++,
          userId,
          title: payload.title,
          code: payload.code,
          language: payload.language,
          dsaPattern: payload.dsaPattern,
          tags: payload.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.codes.push(code);
        for (const testCase of payload.testCases || []) {
          state.testCases.push({
            id: state.nextIds.testCases++,
            savedCodeId: code.id,
            label: testCase.label,
            input: testCase.input,
            expected: testCase.expected ?? null,
            createdAt: new Date().toISOString(),
          });
        }
        return attachTestCases(code, state.testCases);
      },
      async listByUser(userId) {
        return state.codes.filter((code) => code.userId === userId).map((code) => attachTestCases(code, state.testCases));
      },
      async getByIdForUser(userId, codeId) {
        const code = state.codes.find((item) => item.userId === userId && item.id === Number(codeId));
        return code ? attachTestCases(code, state.testCases) : null;
      },
      async update(userId, codeId, payload) {
        const code = state.codes.find((item) => item.userId === userId && item.id === Number(codeId));
        if (!code) return null;
        code.title = payload.title ?? code.title;
        code.code = payload.code ?? code.code;
        code.language = payload.language ?? code.language;
        code.dsaPattern = payload.dsaPattern ?? code.dsaPattern;
        code.tags = payload.tags ?? code.tags;
        code.updatedAt = new Date().toISOString();
        if (payload.testCases) {
          state.testCases = state.testCases.filter((item) => item.savedCodeId !== code.id);
          for (const testCase of payload.testCases) {
            state.testCases.push({
              id: state.nextIds.testCases++,
              savedCodeId: code.id,
              label: testCase.label,
              input: testCase.input,
              expected: testCase.expected ?? null,
              createdAt: new Date().toISOString(),
            });
          }
        }
        return attachTestCases(code, state.testCases);
      },
      async remove(userId, codeId) {
        const index = state.codes.findIndex((item) => item.userId === userId && item.id === Number(codeId));
        if (index < 0) return false;
        const [removed] = state.codes.splice(index, 1);
        state.testCases = state.testCases.filter((item) => item.savedCodeId !== removed.id);
        return true;
      },
    },
    visualizations: {
      async create(userId, payload) {
        const visualization = {
          id: state.nextIds.visualizations++,
          userId,
          savedCodeId: payload.savedCodeId ?? null,
          pattern: payload.pattern,
          input: payload.input,
          steps: payload.steps,
          createdAt: new Date().toISOString(),
        };
        state.visualizations.push(visualization);
        return clone(visualization);
      },
      async listByUser(userId) {
        return state.visualizations.filter((item) => item.userId === userId).map(clone).reverse();
      },
      async getByIdForUser(userId, visualizationId) {
        return clone(state.visualizations.find((item) => item.userId === userId && item.id === Number(visualizationId)) || null);
      },
    },
    executions: {
      async create(userId, payload) {
        const execution = {
          id: state.nextIds.executions++,
          userId,
          savedCodeId: payload.savedCodeId ?? null,
          language: payload.language,
          patternDetected: payload.patternDetected,
          input: payload.input,
          output: payload.output ?? null,
          status: payload.status,
          errorMessage: payload.errorMessage ?? null,
          createdAt: new Date().toISOString(),
        };
        state.executions.push(execution);
        return clone(execution);
      },
      async listByUser(userId) {
        return state.executions.filter((item) => item.userId === userId).map(clone).reverse();
      },
      async getByIdForUser(userId, executionId) {
        return clone(state.executions.find((item) => item.userId === userId && item.id === Number(executionId)) || null);
      },
    },
    progress: {
      async getSummary(userId) {
        const codes = state.codes.filter((item) => item.userId === userId);
        const executions = state.executions.filter((item) => item.userId === userId);
        const visualizations = state.visualizations.filter((item) => item.userId === userId);
        const patternCounts = codes.reduce((acc, item) => {
          acc[item.dsaPattern] = (acc[item.dsaPattern] || 0) + 1;
          return acc;
        }, {});
        const mostUsedPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        return {
          savedCodes: codes.length,
          executionCount: executions.length,
          visualizationCount: visualizations.length,
          mostUsedPattern,
        };
      },
      async getDashboard(userId) {
        const summary = await this.getSummary(userId);
        return {
          summary,
          recentCodes: (await this._codes.listByUser(userId)).slice(0, 5),
          recentExecutions: state.executions.filter((item) => item.userId === userId).slice(-5).reverse().map(clone),
          recentVisualizations: state.visualizations.filter((item) => item.userId === userId).slice(-5).reverse().map(clone),
        };
      },
      _codes: null,
    },
  };
}
