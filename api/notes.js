// 온도 남기기 API — Vercel Serverless Function
// 저장소: Upstash Redis (Vercel Marketplace에서 "Upstash for Redis" 연결 시 환경변수 자동 설정)
// 관리자 기능: 환경변수 ADMIN_TOKEN 을 설정하면 admin.html 에서 전체 조회·삭제·내보내기 가능
import { Redis } from '@upstash/redis';

const KEY = 'ondo:notes';
const MAX_NOTES = 500;

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
const parse = n => (typeof n === 'string' ? JSON.parse(n) : n);
const isAdmin = req => {
  const t = process.env.ADMIN_TOKEN;
  if (!t) return false;
  const h = req.headers['authorization'] || '';
  return h === `Bearer ${t}`;
};

function clean(body) {
  const temp = Number(body.temp);
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 90);
  const name = String(body.name || '').replace(/[<>]/g, '').trim().slice(0, 16);
  if (!Number.isFinite(temp) || temp < 0 || temp > 40) return null;
  if (text.length < 1) return null;
  return { temp: Math.round(temp * 2) / 2, text, name, ts: Date.now() };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const db = redis();
  if (!db) return res.status(503).json({ error: 'storage_not_configured' });

  if (req.method === 'GET') {
    const all = req.query && req.query.all === '1';
    if (all) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const raw = await db.lrange(KEY, 0, -1);
      return res.status(200).json({ notes: raw.map(parse), total: raw.length, max: MAX_NOTES });
    }
    const notes = await db.lrange(KEY, 0, 79);
    return res.status(200).json({ notes: notes.map(parse) });
  }

  if (req.method === 'POST') {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
    const ok = await db.set(`ondo:rl:${ip}`, 1, { nx: true, ex: 20 });
    if (ok !== 'OK') return res.status(429).json({ error: 'rate_limited' });
    const note = clean(req.body || {});
    if (!note) return res.status(400).json({ error: 'invalid' });
    await db.lpush(KEY, JSON.stringify(note));
    await db.ltrim(KEY, 0, MAX_NOTES - 1);
    const notes = await db.lrange(KEY, 0, 79);
    return res.status(201).json({ notes: notes.map(parse) });
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
    const body = req.body || {};
    if (body.all === true) { await db.del(KEY); return res.status(200).json({ deleted: 'all' }); }
    const ts = Number(body.ts);
    if (!Number.isFinite(ts)) return res.status(400).json({ error: 'invalid' });
    const raw = await db.lrange(KEY, 0, -1);
    let removed = 0;
    for (const r of raw) {
      const n = parse(r);
      if (n && Number(n.ts) === ts) { await db.lrem(KEY, 0, typeof r === 'string' ? r : JSON.stringify(r)); removed++; }
    }
    return res.status(200).json({ deleted: removed });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'method_not_allowed' });
}
