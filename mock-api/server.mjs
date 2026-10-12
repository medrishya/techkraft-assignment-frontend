import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.MOCK_API_PORT ?? 3000);
const JWT_SECRET =
  process.env.JWT_SECRET ?? 'mock-secret-for-local-development';

const ACCOUNTS = [
  {
    email: 'sales1@techkraft.com',
    password: 'Techkraft123!',
    role: 'SALES',
    name: 'Sales User 1',
  },
  {
    email: 'sales2@techkraft.com',
    password: 'Techkraft123!',
    role: 'SALES',
    name: 'Sales User 2',
  },
  {
    email: 'reviewer1@techkraft.com',
    password: 'Techkraft123!',
    role: 'REVIEWER',
    name: 'Reviewer User 1',
  },
  {
    email: 'reviewer2@techkraft.com',
    password: 'Techkraft123!',
    role: 'REVIEWER',
    name: 'Reviewer User 2',
  },
  {
    email: 'admin@techkraft.com',
    password: 'Techkraft123!',
    role: 'ADMIN',
    name: 'Admin User',
  },
];

let tokenVersion = 1;

const activeRefreshTokens = new Set();
const revokedAccessTokens = new Set();

// -----------------------------------------------------------------------------
// Authentication helpers
// -----------------------------------------------------------------------------

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const unsignedToken = `${header}.${body}`;

  const signature = createHmac('sha256', JWT_SECRET)
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

function verifyJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    const parsedHeader = JSON.parse(
      Buffer.from(header, 'base64url').toString('utf8'),
    );

    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') {
      return null;
    }

    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

    if (
      !payload.sub ||
      !payload.email ||
      !['SALES', 'REVIEWER', 'ADMIN'].includes(payload.role) ||
      !['access', 'refresh'].includes(payload.type) ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function createTokenPair(account) {
  const now = Math.floor(Date.now() / 1000);
  const id = String(tokenVersion++);

  const accessToken = signJwt({
    sub: account.email,
    email: account.email,
    role: account.role,
    name: account.name,
    iat: now,
    exp: now + 15 * 60,
    type: 'access',
    jti: `access-${id}`,
  });

  const refreshToken = signJwt({
    sub: account.email,
    email: account.email,
    role: account.role,
    name: account.name,
    iat: now,
    exp: now + 7 * 24 * 60 * 60,
    type: 'refresh',
    jti: `refresh-${id}`,
  });

  activeRefreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
}

function send(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': 'http://localhost:4200',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });

  res.end(JSON.stringify(payload));
}

function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization ?? '';

  if (!authorization.startsWith('Bearer ')) return null;

  const token = authorization.slice(7);

  if (revokedAccessTokens.has(token)) return null;

  const payload = verifyJwt(token);

  if (!payload || payload.type !== 'access') return null;

  const account = ACCOUNTS.find(
    (candidate) =>
      candidate.email === payload.email && candidate.role === payload.role,
  );

  if (!account) return null;

  return { account, payload, token };
}

function publicUser(account) {
  return {
    id: account.email,
    email: account.email,
    name: account.name,
    role: account.role,
  };
}

// -----------------------------------------------------------------------------
// Application configuration
// -----------------------------------------------------------------------------

const BUSINESS_NAMES = [
  'Himalayan Traders',
  'Everest Digital',
  'Kathmandu Foods',
  'Lumbini Exports',
  'Pokhara Ventures',
  'Nepal Tech Solutions',
  'Terai Agro Products',
  'Summit Retail',
  'Gandaki Enterprises',
  'Valley Logistics',
  'Mountain View Hospitality',
  'Chitwan Organics',
  'Buddha Handicrafts',
  'Patan Electronics',
  'Janakpur Textiles',
  'Annapurna Supplies',
  'Butwal Wholesale',
  'Biratnagar Industries',
  'Koshi Imports',
  'Mechi Trading',
  'CloudNine Software',
  'GreenLeaf Agriculture',
  'Red Panda Retail',
  'BluePeak Technologies',
  'Sunrise Pharmaceuticals',
  'Golden Temple Crafts',
  'Sagarmatha Tourism',
  'SmartPay Services',
  'Metro Distribution',
  'Riverstone Manufacturing',
  'Terai Healthcare',
  'Digital Nepal Labs',
  'Heritage Furniture',
  'Eastern Motors',
  'Western Dairy',
  'Capital Merchants',
  'Horizon Education',
  'Silverline Apparel',
  'Evergreen Energy',
  'National Office Supplies',
];

const BUSINESS_TYPES = [
  'SOLE_PROPRIETORSHIP',
  'CORPORATION',
  'PARTNERSHIP',
  'PRIVATE_LIMITED_COMPANY',
  'PUBLIC_LIMITED_COMPANY',
  'NON_PROFIT',
  'OTHER',
];

const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];

const RISK_STATUSES = ['PENDING', 'APPROVED', 'NEEDS_INFO', 'REJECTED'];

const SALES_APPLICATION_STATUS = 'DRAFT';
const SALES_RISK_STATUS = 'PENDING';

const FIRST_NAMES = [
  'Aarav',
  'Sita',
  'Ramesh',
  'Anita',
  'Suman',
  'Priya',
  'Bibek',
  'Nisha',
  'Prakash',
  'Sabina',
  'Kiran',
  'Manisha',
  'Roshan',
  'Sarita',
  'Bikash',
  'Asmita',
  'Sanjay',
  'Puja',
  'Nabin',
  'Mina',
];

const LAST_NAMES = [
  'Sharma',
  'Thapa',
  'Gurung',
  'Adhikari',
  'Karki',
  'Rai',
  'Shrestha',
  'Tamang',
  'Bhandari',
  'Poudel',
];

const SALES_USERS = ACCOUNTS.filter((account) => account.role === 'SALES');

const REVIEWER_USERS = ACCOUNTS.filter(
  (account) => account.role === 'REVIEWER',
);

function makeDate(daysAgo, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, (daysAgo * 7) % 60, 0, 0);
  return date.toISOString();
}

function createApplications() {
  return BUSINESS_NAMES.map((businessName, index) => {
    const ownerFirst = FIRST_NAMES[index % FIRST_NAMES.length];
    const ownerLast = LAST_NAMES[index % LAST_NAMES.length];
    const ownerName = `${ownerFirst} ${ownerLast}`;

    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    const createdBy = SALES_USERS[index % SALES_USERS.length];
    const reviewer = REVIEWER_USERS[index % REVIEWER_USERS.length];

    const createdAt = makeDate(40 - index);
    const updatedAt = makeDate(Math.max(0, 20 - Math.floor(index / 2)));

    return {
      id: `app-${String(index + 1).padStart(3, '0')}`,
      business_name: businessName,
      legal_business_name: `${businessName} ${
        index % 2 === 0 ? 'Pvt. Ltd.' : 'Limited'
      }`,
      business_type: BUSINESS_TYPES[index % BUSINESS_TYPES.length],
      owner_name: ownerName,
      owner_email: `${slug}@example.com`,
      owner_phone: `98${String(10000000 + index * 17391).slice(0, 8)}`,
      processing_volume: (index + 1) * 12500 + 7500,
      processing_currency: ['NPR', 'USD', 'EUR'][index % 3],
      application_status:
        APPLICATION_STATUSES[index % APPLICATION_STATUSES.length],
      risk_status: RISK_STATUSES[index % RISK_STATUSES.length],
      created_by_id: createdBy.email,
      created_by_name: createdBy.name,
      assigned_reviewer_id: reviewer.email,
      assigned_reviewer_name: reviewer.name,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  });
}

const APPLICATIONS = createApplications();

const REVIEW_HISTORY = new Map(
  APPLICATIONS.map((application) => [
    application.id,
    [
      {
        id: `history-${application.id}-created`,
        application_id: application.id,
        event_type: 'APPLICATION_CREATED',
        previous_application_status: null,
        application_status: application.application_status,
        previous_risk_status: null,
        risk_status: application.risk_status,
        actor_id: application.created_by_id,
        actor_name: application.created_by_name,
        comments: 'Application created.',
        created_at: application.created_at,
      },
    ],
  ]),
);

// -----------------------------------------------------------------------------
// CRUD helpers
// -----------------------------------------------------------------------------

const EDITABLE_FIELDS = [
  'business_name',
  'legal_business_name',
  'business_type',
  'owner_name',
  'owner_email',
  'owner_phone',
  'processing_volume',
  'processing_currency',
];

function getApplicationResponse(application, role) {
  const response = {
    ...application,
    reviewer_id: application.assigned_reviewer_id ?? null,
  };

  if (role === 'SALES') {
    delete response.created_by_id;
    delete response.created_by_name;
  } else if (role === 'REVIEWER') {
    delete response.assigned_reviewer_id;
    delete response.assigned_reviewer_name;
  }

  return response;
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidEnum(value, values) {
  return values.includes(value);
}

function isValidProcessingVolume(value) {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

function normalizeProcessingVolume(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number(value);
}

function getReviewer(reviewerId) {
  if (!reviewerId) return null;

  return (
    REVIEWER_USERS.find((reviewer) => reviewer.email === reviewerId) ?? null
  );
}

function canViewApplication(user, application) {
  if (user.role === 'ADMIN') return true;

  if (user.role === 'SALES') {
    return application.created_by_id === user.email;
  }

  if (user.role === 'REVIEWER') {
    return application.assigned_reviewer_id === user.email;
  }

  return false;
}

function canUpdateApplication(user, application) {
  return canViewApplication(user, application);
}

function matchesApplication(application, search, status, risk) {
  const normalizedSearch = search.toLowerCase();

  const matchesSearch =
    !normalizedSearch ||
    [
      application.id,
      application.business_name,
      application.legal_business_name,
      application.business_type,
      application.owner_name,
      application.owner_email,
      application.owner_phone,
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(normalizedSearch),
    );

  return (
    matchesSearch &&
    (!status || application.application_status === status) &&
    (!risk || application.risk_status === risk)
  );
}

function generateApplicationId() {
  const highestId = APPLICATIONS.reduce((highest, application) => {
    const match = /^app-(\d+)$/.exec(application.id ?? '');
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `app-${String(highestId + 1).padStart(3, '0')}`;
}

function validateApplicationFields(body, { creating = false } = {}) {
  const errors = {};

  if (creating || Object.hasOwn(body, 'business_name')) {
    if (!normalizeText(body.business_name)) {
      errors.business_name = 'business_name is required.';
    }
  }

  if (creating || Object.hasOwn(body, 'business_type')) {
    if (!isValidEnum(body.business_type, BUSINESS_TYPES)) {
      errors.business_type = 'Invalid business_type.';
    }
  }

  if (
    Object.hasOwn(body, 'processing_volume') &&
    !isValidProcessingVolume(body.processing_volume)
  ) {
    errors.processing_volume =
      'processing_volume must be a non-negative number or null.';
  }

  if (
    Object.hasOwn(body, 'application_status') &&
    !isValidEnum(body.application_status, APPLICATION_STATUSES)
  ) {
    errors.application_status = 'Invalid application_status.';
  }

  if (
    Object.hasOwn(body, 'risk_status') &&
    !isValidEnum(body.risk_status, RISK_STATUSES)
  ) {
    errors.risk_status = 'Invalid risk_status.';
  }

  if (
    Object.hasOwn(body, 'owner_email') &&
    body.owner_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.owner_email))
  ) {
    errors.owner_email = 'owner_email must be a valid email address.';
  }

  return errors;
}

function getSalesStatusError(role, body) {
  if (role !== 'SALES') return null;

  if (
    Object.hasOwn(body, 'application_status') &&
    body.application_status !== SALES_APPLICATION_STATUS
  ) {
    return 'Sales users can only set application_status to DRAFT.';
  }

  if (
    Object.hasOwn(body, 'risk_status') &&
    body.risk_status !== SALES_RISK_STATUS
  ) {
    return 'Sales users can only set risk_status to PENDING.';
  }

  return null;
}

function filterEditableFields(body) {
  const fields = {};

  for (const field of EDITABLE_FIELDS) {
    if (Object.hasOwn(body, field)) {
      fields[field] =
        field === 'processing_volume'
          ? normalizeProcessingVolume(body[field])
          : normalizeText(body[field]);
    }
  }

  return fields;
}

function applyStatusUpdates(updates, body, role) {
  if (
    ['ADMIN', 'REVIEWER', 'SALES'].includes(role) &&
    Object.hasOwn(body, 'application_status')
  ) {
    updates.application_status = body.application_status;
  }

  if (
    ['ADMIN', 'REVIEWER', 'SALES'].includes(role) &&
    Object.hasOwn(body, 'risk_status')
  ) {
    updates.risk_status = body.risk_status;
  }
}

function validateReviewerAssignment(body, role, errors) {
  if (!Object.hasOwn(body, 'reviewer_id')) return;

  if (role !== 'ADMIN') {
    errors.reviewer_id = 'Only admins can assign reviewers.';
    return;
  }

  if (
    body.reviewer_id !== null &&
    body.reviewer_id !== '' &&
    (typeof body.reviewer_id !== 'string' ||
      !REVIEWER_USERS.some((reviewer) => reviewer.email === body.reviewer_id))
  ) {
    errors.reviewer_id = 'reviewer_id must match a reviewer email or be null.';
  }
}

function applyReviewerAssignment(updates, body, role) {
  if (role !== 'ADMIN' || !Object.hasOwn(body, 'reviewer_id')) {
    return null;
  }

  const reviewer = getReviewer(body.reviewer_id);

  updates.assigned_reviewer_id = reviewer?.email ?? null;
  updates.assigned_reviewer_name = reviewer?.name ?? null;

  return reviewer;
}

function addHistory(application, event) {
  const history = REVIEW_HISTORY.get(application.id) ?? [];
  history.push(event);
  REVIEW_HISTORY.set(application.id, history);
}

// -----------------------------------------------------------------------------
// Request body reader
// -----------------------------------------------------------------------------

async function readJsonBody(req) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;

    if (totalBytes > 1_000_000) {
      const error = new Error('Request body too large.');
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!rawBody.trim()) return {};

  let parsed;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    const error = new Error('Invalid JSON.');
    error.statusCode = 400;
    throw error;
  }

  if (!isPlainObject(parsed)) {
    const error = new Error('Request body must be a JSON object.');
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

// -----------------------------------------------------------------------------
// HTTP server
// -----------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': 'http://localhost:4200',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'Content-Type, Authorization',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    });

    return res.end();
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  let body = {};

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      body = await readJsonBody(req);
    } catch (error) {
      return send(res, error.statusCode ?? 400, {
        message: error.message ?? 'Invalid request body.',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // POST /auth/login
  // ---------------------------------------------------------------------------

  if (req.method === 'POST' && pathname === '/auth/login') {
    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return send(res, 400, {
        message: 'email and password are required',
      });
    }

    const account = ACCOUNTS.find(
      (candidate) =>
        candidate.email === email.toLowerCase() &&
        candidate.password === password,
    );

    if (!account) {
      return send(res, 401, {
        message: 'Invalid email or password',
      });
    }

    return send(res, 200, createTokenPair(account));
  }

  // ---------------------------------------------------------------------------
  // POST /auth/refresh
  // ---------------------------------------------------------------------------

  if (req.method === 'POST' && pathname === '/auth/refresh') {
    const { refreshToken } = body;

    if (
      typeof refreshToken !== 'string' ||
      !activeRefreshTokens.has(refreshToken)
    ) {
      return send(res, 401, { message: 'Invalid refresh token' });
    }

    const payload = verifyJwt(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      activeRefreshTokens.delete(refreshToken);
      return send(res, 401, { message: 'Invalid refresh token' });
    }

    const account = ACCOUNTS.find(
      (candidate) =>
        candidate.email === payload.email && candidate.role === payload.role,
    );

    activeRefreshTokens.delete(refreshToken);

    if (!account) {
      return send(res, 401, { message: 'Invalid refresh token' });
    }

    return send(res, 200, createTokenPair(account));
  }

  // ---------------------------------------------------------------------------
  // POST /auth/logout
  // ---------------------------------------------------------------------------

  if (req.method === 'POST' && pathname === '/auth/logout') {
    const authorization = req.headers.authorization ?? '';
    const accessToken = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';

    if (accessToken) revokedAccessTokens.add(accessToken);

    if (typeof body.refreshToken === 'string') {
      activeRefreshTokens.delete(body.refreshToken);
    }

    return send(res, 200, { ok: true });
  }

  // ---------------------------------------------------------------------------
  // GET /me
  // ---------------------------------------------------------------------------

  if (req.method === 'GET' && pathname === '/me') {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    return send(res, 200, publicUser(authenticated.account));
  }

  // ---------------------------------------------------------------------------
  // GET /api/protected
  // ---------------------------------------------------------------------------

  if (req.method === 'GET' && pathname === '/api/protected') {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    return send(res, 200, {
      message: 'Authorized mock API response',
      user: publicUser(authenticated.account),
    });
  }

  // ---------------------------------------------------------------------------
  // GET /api/users?role=REVIEWER
  // GET /api/users/:email
  // ADMIN can list users; admins and reviewers can list reviewer options.
  // Passwords are never included in responses.
  // ---------------------------------------------------------------------------

  if (req.method === 'GET' && pathname === '/api/users') {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const roleFilter = url.searchParams.get('role');

    if (roleFilter && !['ADMIN', 'REVIEWER', 'SALES'].includes(roleFilter)) {
      return send(res, 400, { message: 'Invalid role filter.' });
    }

    if (
      authenticated.account.role !== 'ADMIN' &&
      !(authenticated.account.role === 'REVIEWER' && roleFilter === 'REVIEWER')
    ) {
      return send(res, 403, {
        message: 'You do not have permission to list these users.',
      });
    }

    const users = ACCOUNTS.filter(
      (account) => !roleFilter || account.role === roleFilter,
    ).map(publicUser);

    return send(res, 200, { data: users });
  }

  const userRouteMatch = /^\/api\/users\/([^/]+)$/.exec(pathname);

  if (req.method === 'GET' && userRouteMatch) {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    if (authenticated.account.role !== 'ADMIN') {
      return send(res, 403, {
        message: 'Only admins can view individual user details.',
      });
    }

    let email;

    try {
      email = decodeURIComponent(userRouteMatch[1]).toLowerCase();
    } catch {
      return send(res, 400, { message: 'Invalid user identifier.' });
    }

    const account = ACCOUNTS.find((item) => item.email === email);

    if (!account) {
      return send(res, 404, { message: 'User not found.' });
    }

    return send(res, 200, { data: publicUser(account) });
  }

  // ---------------------------------------------------------------------------
  // GET /api/applications
  // ---------------------------------------------------------------------------

  if (req.method === 'GET' && pathname === '/api/applications') {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const limit = Math.min(
      parsePositiveInteger(url.searchParams.get('limit'), 10),
      100,
    );

    const search = url.searchParams.get('search') ?? '';
    const status = url.searchParams.get('application_status') ?? '';
    const risk = url.searchParams.get('risk_status') ?? '';

    if (status && !APPLICATION_STATUSES.includes(status)) {
      return send(res, 400, {
        message: 'Invalid application_status filter.',
      });
    }

    if (risk && !RISK_STATUSES.includes(risk)) {
      return send(res, 400, {
        message: 'Invalid risk_status filter.',
      });
    }

    let filtered = APPLICATIONS.filter((application) =>
      canViewApplication(authenticated.account, application),
    );

    filtered = filtered.filter((application) =>
      matchesApplication(application, search, status, risk),
    );

    filtered.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    const total = filtered.length;
    const start = (page - 1) * limit;

    const data = filtered
      .slice(start, start + limit)
      .map((application) =>
        getApplicationResponse(application, authenticated.account.role),
      );

    return send(res, 200, { data, total, page, limit });
  }

  // ---------------------------------------------------------------------------
  // POST /api/applications
  // ---------------------------------------------------------------------------

  if (req.method === 'POST' && pathname === '/api/applications') {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const role = authenticated.account.role;
    const errors = validateApplicationFields(body, { creating: true });

    const salesStatusError = getSalesStatusError(role, body);

    if (salesStatusError) {
      return send(res, 403, { message: salesStatusError });
    }

    if (role !== 'ADMIN' && Object.hasOwn(body, 'reviewer_id')) {
      return send(res, 403, {
        message: 'Only admins can assign reviewers.',
      });
    }

    validateReviewerAssignment(body, role, errors);

    if (Object.keys(errors).length > 0) {
      return send(res, 400, {
        message: 'Application validation failed.',
        errors,
      });
    }

    const reviewer = role === 'ADMIN' ? getReviewer(body.reviewer_id) : null;
    const now = new Date().toISOString();

    const application = {
      id: generateApplicationId(),
      business_name: normalizeText(body.business_name),
      legal_business_name: normalizeText(body.legal_business_name),
      business_type: body.business_type,
      owner_name: normalizeText(body.owner_name),
      owner_email: normalizeText(body.owner_email),
      owner_phone: normalizeText(body.owner_phone),
      processing_volume: normalizeProcessingVolume(body.processing_volume),
      processing_currency: normalizeText(body.processing_currency) || 'NPR',
      application_status:
        role === 'SALES'
          ? SALES_APPLICATION_STATUS
          : (body.application_status ?? 'DRAFT'),
      risk_status:
        role === 'SALES' ? SALES_RISK_STATUS : (body.risk_status ?? 'PENDING'),
      created_by_id: authenticated.account.email,
      created_by_name: authenticated.account.name,
      assigned_reviewer_id: reviewer?.email ?? null,
      assigned_reviewer_name: reviewer?.name ?? null,
      created_at: now,
      updated_at: now,
    };

    APPLICATIONS.push(application);

    REVIEW_HISTORY.set(application.id, [
      {
        id: `history-${application.id}-created`,
        application_id: application.id,
        event_type: 'APPLICATION_CREATED',
        previous_application_status: null,
        application_status: application.application_status,
        previous_risk_status: null,
        risk_status: application.risk_status,
        actor_id: authenticated.account.email,
        actor_name: authenticated.account.name,
        comments: 'Application created.',
        created_at: now,
      },
    ]);

    if (reviewer) {
      addHistory(application, {
        id: `history-${application.id}-assigned-${Date.now()}`,
        application_id: application.id,
        event_type: 'REVIEWER_ASSIGNED',
        previous_reviewer_id: null,
        previous_reviewer_name: null,
        reviewer_id: reviewer.email,
        reviewer_name: reviewer.name,
        actor_id: authenticated.account.email,
        actor_name: authenticated.account.name,
        comments: 'Reviewer assigned when application was created.',
        created_at: now,
      });
    }

    return send(res, 201, {
      message: 'Application created successfully.',
      data: getApplicationResponse(application, role),
    });
  }

  const applicationRouteMatch = /^\/api\/applications\/([^/]+)$/.exec(pathname);

  // ---------------------------------------------------------------------------
  // GET /api/applications/:id
  // ---------------------------------------------------------------------------

  if (req.method === 'GET' && applicationRouteMatch) {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const application = APPLICATIONS.find(
      (item) => item.id === applicationRouteMatch[1],
    );

    if (
      !application ||
      !canViewApplication(authenticated.account, application)
    ) {
      return send(res, 404, { message: 'Application not found.' });
    }

    return send(
      res,
      200,
      getApplicationResponse(application, authenticated.account.role),
    );
  }

  // ---------------------------------------------------------------------------
  // PUT / PATCH /api/applications/:id
  // PATCH supports admin reviewer reassignment with:
  // { "reviewer_id": "reviewer2@techkraft.com" }
  // Use null or "" to unassign.
  // ---------------------------------------------------------------------------

  if (['PUT', 'PATCH'].includes(req.method) && applicationRouteMatch) {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const id = applicationRouteMatch[1];
    const index = APPLICATIONS.findIndex((item) => item.id === id);

    if (index === -1) {
      return send(res, 404, { message: 'Application not found.' });
    }

    const existing = APPLICATIONS[index];
    const role = authenticated.account.role;

    if (!canUpdateApplication(authenticated.account, existing)) {
      return send(res, 404, { message: 'Application not found.' });
    }

    const salesStatusError = getSalesStatusError(role, body);

    if (salesStatusError) {
      return send(res, 403, { message: salesStatusError });
    }

    const assignmentRequested = Object.hasOwn(body, 'reviewer_id');

    if (assignmentRequested && role !== 'ADMIN') {
      return send(res, 403, {
        message: 'Only admins can assign reviewers.',
      });
    }

    const forbiddenFields = [
      'id',
      'created_by_id',
      'created_by_name',
      'created_at',
      'updated_at',
      'assigned_reviewer_id',
      'assigned_reviewer_name',
    ];

    let assigned_details = {};
    if (role !== 'ADMIN') {
      if (forbiddenFields.some((field) => Object.hasOwn(body, field))) {
        return send(res, 400, {
          message: 'System-managed fields cannot be updated directly.',
        });
      }
    } else {
      assigned_details = {
        assigned_reviewer_name:
          ACCOUNTS.find(
            (account) =>
              account.email === body.assigned_reviewer_id &&
              account.role === 'REVIEWER',
          )?.name || '',
        assigned_reviewer_id: body?.assigned_reviewer_id,
      };
    }

    const errors = validateApplicationFields(body);

    validateReviewerAssignment(body, role, errors);

    if (Object.keys(errors).length > 0) {
      return send(res, 400, {
        message: 'Application validation failed.',
        errors,
      });
    }

    const updates = filterEditableFields(body);
    applyStatusUpdates(updates, body, role);

    const previousReviewerId = existing.assigned_reviewer_id ?? null;
    const previousReviewerName = existing.assigned_reviewer_name ?? null;

    const assignedReviewer = applyReviewerAssignment(updates, body, role);

    const updatedApplication = {
      ...existing,
      ...updates,
      id: existing.id,
      created_by_id: existing.created_by_id,
      created_by_name: existing.created_by_name,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
      ...assigned_details,
    };

    APPLICATIONS[index] = updatedApplication;

    if (
      assignmentRequested &&
      previousReviewerId !== (assignedReviewer?.email ?? null)
    ) {
      addHistory(updatedApplication, {
        id: `history-${id}-assignment-${Date.now()}`,
        application_id: id,
        event_type: 'REVIEWER_ASSIGNED',
        previous_reviewer_id: previousReviewerId,
        previous_reviewer_name: previousReviewerName,
        reviewer_id: assignedReviewer?.email ?? null,
        reviewer_name: assignedReviewer?.name ?? null,
        actor_id: authenticated.account.email,
        actor_name: authenticated.account.name,
        comments: assignedReviewer
          ? `Reviewer assigned to ${assignedReviewer.name}.`
          : 'Reviewer assignment removed.',
        created_at: updatedApplication.updated_at,
      });
    }

    return send(res, 200, {
      message: assignmentRequested
        ? 'Reviewer assignment updated successfully.'
        : 'Application updated successfully.',
      data: getApplicationResponse(updatedApplication, role),
    });
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/applications/:id
  // ---------------------------------------------------------------------------

  if (req.method === 'DELETE' && applicationRouteMatch) {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const id = applicationRouteMatch[1];
    const index = APPLICATIONS.findIndex((item) => item.id === id);

    if (index === -1) {
      return send(res, 404, { message: 'Application not found.' });
    }

    const application = APPLICATIONS[index];
    const role = authenticated.account.role;

    if (
      role !== 'ADMIN' &&
      !(
        role === 'SALES' &&
        application.created_by_id === authenticated.account.email
      )
    ) {
      return send(res, 403, {
        message: 'You do not have permission to delete this application.',
      });
    }

    APPLICATIONS.splice(index, 1);
    REVIEW_HISTORY.delete(id);

    return send(res, 200, {
      message: 'Application deleted successfully.',
      id,
    });
  }

  // ---------------------------------------------------------------------------
  // GET /api/applications/:id/reviews
  // POST /api/applications/:id/reviews
  // ---------------------------------------------------------------------------

  const reviewsMatch = /^\/api\/applications\/([^/]+)\/reviews$/.exec(pathname);

  if (reviewsMatch && ['GET', 'POST'].includes(req.method)) {
    const authenticated = getAuthenticatedUser(req);

    if (!authenticated) {
      return send(res, 401, { message: 'Unauthorized' });
    }

    const user = {
      id: authenticated.account.email,
      email: authenticated.account.email,
      name: authenticated.account.name,
      role: authenticated.account.role,
    };

    const applicationId = decodeURIComponent(reviewsMatch[1]);
    const application = APPLICATIONS.find((item) => item.id === applicationId);

    if (!application) {
      return send(res, 404, { message: 'Application not found.' });
    }

    if (!canViewApplication(user, application)) {
      return send(res, 403, { message: 'Forbidden.' });
    }

    if (req.method === 'GET') {
      const history = REVIEW_HISTORY.get(applicationId) ?? [];

      return send(res, 200, {
        data: history.filter((item) => item.event_type === 'REVIEW_DECISION'),
      });
    }

    if (!['ADMIN', 'REVIEWER'].includes(user.role)) {
      return send(res, 403, {
        message: 'Only reviewers and admins can submit review decisions.',
      });
    }

    // A reviewer can decide only on applications currently assigned to them.
    if (
      user.role === 'REVIEWER' &&
      application.assigned_reviewer_id !== user.email
    ) {
      return send(res, 403, {
        message: 'This application is not assigned to you.',
      });
    }

    const { decision, comments = '' } = body;
    const allowedDecisions = ['APPROVE', 'REJECT', 'REQUEST_INFO'];

    if (
      !allowedDecisions.includes(decision) ||
      typeof comments !== 'string' ||
      comments.length > 2000
    ) {
      return send(res, 400, {
        message: 'Invalid review submission.',
      });
    }

    if (['REJECT', 'REQUEST_INFO'].includes(decision) && !comments.trim()) {
      return send(res, 400, {
        message: 'Comments are required for this decision.',
      });
    }

    const previousApplicationStatus = application.application_status;
    const previousRiskStatus = application.risk_status;

    const statusByDecision = {
      APPROVE: {
        application_status: 'APPROVED',
        risk_status: 'APPROVED',
      },
      REJECT: {
        application_status: 'REJECTED',
        risk_status: 'REJECTED',
      },
      REQUEST_INFO: {
        application_status: 'UNDER_REVIEW',
        risk_status: 'NEEDS_INFO',
      },
    };

    Object.assign(application, statusByDecision[decision]);
    application.updated_at = new Date().toISOString();

    const review = {
      id: `review-${applicationId}-${Date.now()}`,
      application_id: applicationId,
      event_type: 'REVIEW_DECISION',
      decision,
      previous_application_status: previousApplicationStatus,
      application_status: application.application_status,
      previous_risk_status: previousRiskStatus,
      risk_status: application.risk_status,
      actor_id: user.id,
      actor_name: user.name,
      comments: comments.trim(),
      created_at: application.updated_at,
    };

    addHistory(application, review);

    return send(res, 201, {
      message: 'Review decision submitted successfully.',
      data: getApplicationResponse(application, user.role),
      review,
    });
  }

  return send(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Mock API listening at http://localhost:${PORT}`);
  console.log(`Mock applications available: ${APPLICATIONS.length}`);
});
