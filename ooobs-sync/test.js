const assert = require('node:assert');
const { normPhone, build } = require('./sync');

for (const p of ['+7 999 123-45-67', '8 (999) 123 45 67', '79991234567']) assert.strictEqual(normPhone(p), '+79991234567');
for (const p of ['9005551212', '123', '', 'не указан', '+7 999', null]) assert.strictEqual(normPhone(p), null);

(async () => {
  const orders = await (await fetch('https://test.ooobs.ru/api/orders')).json();
  const { result, dropped } = build(orders);
  assert.deepStrictEqual(result.stats, { received: 17, unique: 7, duplicates_merged: 5, invalid_dropped: 5 });
  assert.deepStrictEqual(dropped.map((d) => d.id), [9, 14, 15, 16, 17]);
  const by = Object.fromEntries(result.clients.map((c) => [c.phone, c]));
  assert.strictEqual(by['+79991234567'].amount, 5000);   // макс. amount
  assert.strictEqual(by['+79160000001'].name, 'Мария С.'); // равный amount -> позже
  assert.deepStrictEqual(build(orders), build(orders));    // идемпотентность
  console.log('ok');
})();
