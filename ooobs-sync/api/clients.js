const { get } = require('../sync');

module.exports = async (req, res) => {
  try {
    res.status(200).json((await get()).result);
  } catch (e) {
    res.status(502).json({ error: String(e.message) });
  }
};
