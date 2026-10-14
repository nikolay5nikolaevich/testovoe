const SRC = 'https://test.ooobs.ru/api/orders';
const TTL = 60_000;

// +7XXXXXXXXXX из 11 цифр (7/8 в начале); всё остальное, включая 10 цифр без кода, — null
function normPhone(raw) {
  const d = String(raw ?? '').replace(/\D/g, '');
  return d.length === 11 && (d[0] === '7' || d[0] === '8') ? '+7' + d.slice(1) : null;
}

const time = (o) => Date.parse(o.created_at) || 0;
// true, если a лучше b: больший amount, при равенстве — более поздний created_at
const better = (a, b) => a.amount !== b.amount ? a.amount > b.amount : time(a) > time(b);

function build(orders) {
  const best = new Map();
  const dropped = [];
  let valid = 0;
  for (const o of orders) {
    const phone = normPhone(o.phone);
    if (!phone) { dropped.push({ id: o.id, name: o.name, phone: o.phone }); continue; }
    valid++;
    const cur = { name: o.name, phone, email: o.email, amount: Number(o.amount) || 0, created_at: o.created_at };
    const prev = best.get(phone);
    if (!prev || better(cur, prev)) best.set(phone, cur);
  }
  const clients = [...best.values()].map(({ created_at, ...c }) => c);
  return {
    result: {
      clients,
      stats: {
        received: orders.length,
        unique: clients.length,
        duplicates_merged: valid - clients.length,
        invalid_dropped: dropped.length,
      },
    },
    dropped,
  };
}

let cache; // { at, data } — последний удачный результат
async function get() {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  try {
    const r = await fetch(SRC, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const orders = await r.json();
    if (!Array.isArray(orders)) throw new Error('upstream: not an array');
    cache = { at: Date.now(), data: build(orders) };
  } catch (e) {
    if (!cache) throw e; // ponytail: при падении апстрима отдаём последний удачный результат
  }
  return cache.data;
}

module.exports = { normPhone, build, get };
