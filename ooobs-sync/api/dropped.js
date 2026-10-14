const { get } = require('../sync');

// Отброшенные заявки: можно уточнить номер у клиента, чтобы не потерять его
module.exports = async (req, res) => {
  try {
    res.status(200).json({ dropped: (await get()).dropped });
  } catch (e) {
    res.status(502).json({ error: String(e.message) });
  }
};
