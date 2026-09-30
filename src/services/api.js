import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ Auth ============
export const loginUser = (credentials) => api.post('/auth/login', credentials).then(r => r.data);
export const loginSSO = (ssoData) => api.post('/auth/sso/login', ssoData).then(r => r.data);
export const validatePassword = (password) => api.post('/auth/validate-password', { password }).then(r => r.data);
export const refreshSession = () => api.post('/auth/refresh').then(r => r.data);
export const logoutUser = () => api.post('/auth/logout').then(r => r.data);
export const fetchCurrentUser = () => api.get('/auth/me').then(r => r.data);

// ============ Master Data ============
export const fetchMasterData = () => api.get('/master-data').then(r => r.data);
export const updateInterestRate = (productKey, data) => api.put(`/master-data/interest-rates/${productKey}`, data).then(r => r.data);
export const updateFeePenalty = (accountType, data) => api.put(`/master-data/fee-penalties/${accountType}`, data).then(r => r.data);

// ============ Accounts ============
export const fetchAccounts = (userId = 1) => api.get(`/accounts?userId=${userId}`).then(r => r.data);
export const fetchTransactions = (accountId) => api.get(`/accounts/${accountId}/transactions`).then(r => r.data);
export const postTransaction = (data) => api.post('/accounts/transaction', data).then(r => r.data);
export const calculateInterest = (accountId) => api.post(`/accounts/${accountId}/calculate-interest`).then(r => r.data);
export const updateOverdraftLimit = (accountId, limit) => api.post(`/accounts/${accountId}/overdraft-limit`, { limit }).then(r => r.data);

// ============ Corporate ============
export const fetchCorporateRequests = () => api.get('/corporate/requests').then(r => r.data);
export const submitCorporateRequest = (data) => api.post('/corporate/request', data).then(r => r.data);
export const submitCheckerDecision = (requestId, data) => api.post(`/corporate/request/${requestId}/decision`, data).then(r => r.data);

// ============ Loans ============
export const fetchLoans = (userId) => api.get(userId ? `/loans?userId=${userId}` : '/loans').then(r => r.data);
export const fetchAmortization = (loanId) => api.get(`/loans/${loanId}/amortization`).then(r => r.data);
export const applyForLoan = (data) => api.post('/loans/apply', data).then(r => r.data);
export const approveLoan = (loanId, managerUserId) => api.post(`/loans/${loanId}/approve`, { managerUserId }).then(r => r.data);

// ============ Audit ============
export const fetchAuditLogs = () => api.get('/audit').then(r => r.data);

export default api;

