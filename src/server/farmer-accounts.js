import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_FARMS = 30;

function cleanText(value, max = 80) {
  if (typeof value !== "string") throw new Error("Text fields must be strings.");
  const text = value.trim();
  if (text.length > max) throw new Error(`Text must be ${max} characters or fewer.`);
  return text;
}

function emailValue(value) {
  const email = cleanText(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  return email;
}

function farmValue(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid farm record.");
  const name = cleanText(input.name || "", 80);
  const lat = input.latitude === "" || input.latitude == null ? NaN : Number(input.latitude);
  const lon = input.longitude === "" || input.longitude == null ? NaN : Number(input.longitude);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("Farm name and valid coordinates are required.");
  const startYear = Number(input.startYear), endYear = Number(input.endYear);
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear < 1981 || endYear >= currentYear || startYear > endYear) throw new Error("Choose a valid historical period.");
  const soilPh = input.soilPh === "" || input.soilPh == null ? null : Number(input.soilPh);
  if (soilPh !== null && (!Number.isFinite(soilPh) || soilPh < 0 || soilPh > 14)) throw new Error("Soil pH must be a laboratory value from 0 to 14.");
  const priorities = Array.isArray(input.priorities) ? input.priorities : [];
  if (priorities.length > 4 || priorities.some((value) => !["water", "cover", "diversity", "market"].includes(value))) throw new Error("Invalid priorities.");
  const globalFields = ["latitude", "longitude", "elevationM", "koppen", "texture", "ph", "som", "annualRainMm", "irrigation", "seasonEtcMm", "effectiveRainMm", "netIrrigationMm"];
  const globalAssessment = {};
  if (input.globalAssessment != null) {
    if (typeof input.globalAssessment !== "object" || Array.isArray(input.globalAssessment)) throw new Error("Invalid global assessment notes.");
    for (const key of globalFields) globalAssessment[key] = cleanText(input.globalAssessment[key] || "", 80);
    const phases = input.globalAssessment.sequence;
    if (!Array.isArray(phases) || phases.length !== 3) throw new Error("Invalid crop sequence notes.");
    globalAssessment.sequence = phases.map((value) => cleanText(value || "", 80));
  }
  return {
    name, latitude: lat, longitude: lon, startYear, endYear,
    lastCrop: cleanText(input.lastCrop || ""), priorCrop: cleanText(input.priorCrop || ""),
    soilTexture: cleanText(input.soilTexture || ""), soilPh, priorities: [...new Set(priorities)], globalAssessment
  };
}

async function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function passwordMatches(password, stored) {
  const [salt, hex] = stored.split(":");
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createFarmerAccountService(filePath) {
  let data;
  try { data = JSON.parse(await readFile(filePath, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; data = { users: [], farms: [] }; }
  if (!Array.isArray(data.users) || !Array.isArray(data.farms)) throw new Error("Invalid local account database.");
  const sessions = new Map();
  const attempts = new Map();
  let writes = Promise.resolve();
  function save() {
    writes = writes.then(async () => {
      await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
      const temporary = `${filePath}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
      await rename(temporary, filePath);
    });
    return writes;
  }
  function cookie(req, token) {
    const secure = req.socket.encrypted || req.headers["x-forwarded-proto"] === "https";
    return `terrasown_session=${token}; HttpOnly; SameSite=Strict; Path=/api/account; Max-Age=${token ? 43200 : 0}${secure ? "; Secure" : ""}`;
  }
  function sessionUser(req) {
    const token = /(?:^|;\s*)terrasown_session=([a-f0-9]{64})/.exec(req.headers.cookie || "")?.[1];
    const session = token && sessions.get(createHash("sha256").update(token).digest("hex"));
    if (!session || session.expires < Date.now()) return null;
    return data.users.find((user) => user.id === session.userId) || null;
  }
  function issueSession(req, user) {
    const token = randomBytes(32).toString("hex");
    sessions.set(createHash("sha256").update(token).digest("hex"), { userId: user.id, expires: Date.now() + SESSION_MS });
    return cookie(req, token);
  }
  function logout(req) {
    const token = /(?:^|;\s*)terrasown_session=([a-f0-9]{64})/.exec(req.headers.cookie || "")?.[1];
    if (token) sessions.delete(createHash("sha256").update(token).digest("hex"));
    return cookie(req, "");
  }
  async function register(input, req) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid account request.");
    const email = emailValue(input.email);
    const name = cleanText(input.name || "", 80);
    const password = input.password;
    if (!name || typeof password !== "string" || password.length < 12 || password.length > 128) throw new Error("Enter your name and a password of 12–128 characters.");
    if (data.users.some((user) => user.email === email)) throw new Error("An account already uses this email.");
    const user = { id: randomUUID(), name, email, passwordHash: await passwordHash(password) };
    data.users.push(user);
    await save();
    return { user: { id: user.id, name, email }, cookie: issueSession(req, user) };
  }
  async function login(input, req) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid account request.");
    const email = emailValue(input.email);
    if (typeof input.password !== "string" || input.password.length > 128) throw new Error("Email or password was not recognized.");
    const key = `${req.socket.remoteAddress || "local"}:${email}`;
    const attempt = attempts.get(key) || { count: 0, until: 0 };
    if (attempt.until > Date.now()) { const error = new Error("Too many attempts. Try again in 15 minutes."); error.status = 429; throw error; }
    const user = data.users.find((item) => item.email === email);
    const valid = user && typeof input.password === "string" && await passwordMatches(input.password, user.passwordHash);
    if (!valid) {
      const count = attempt.count + 1;
      attempts.set(key, { count, until: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
      const error = new Error("Email or password was not recognized."); error.status = 401; throw error;
    }
    attempts.delete(key);
    return { user: { id: user.id, name: user.name, email }, cookie: issueSession(req, user) };
  }
  function listFarms(user) { return data.farms.filter((farm) => farm.ownerId === user.id).map(({ ownerId, ...farm }) => farm); }
  async function saveFarm(user, input) {
    const value = farmValue(input);
    const existing = input.id && data.farms.find((farm) => farm.id === input.id && farm.ownerId === user.id);
    if (input.id && !existing) { const error = new Error("Farm not found."); error.status = 404; throw error; }
    if (!existing && listFarms(user).length >= MAX_FARMS) throw new Error("This local prototype supports up to 30 saved farms per account.");
    const farm = existing || { id: randomUUID(), ownerId: user.id, createdAt: new Date().toISOString() };
    Object.assign(farm, value, { updatedAt: new Date().toISOString() });
    if (!existing) data.farms.push(farm);
    await save();
    const { ownerId, ...publicFarm } = farm;
    return publicFarm;
  }
  async function deleteFarm(user, id) {
    const index = data.farms.findIndex((farm) => farm.id === id && farm.ownerId === user.id);
    if (index < 0) { const error = new Error("Farm not found."); error.status = 404; throw error; }
    data.farms.splice(index, 1);
    await save();
  }
  return { register, login, sessionUser, logout, listFarms, saveFarm, deleteFarm };
}
