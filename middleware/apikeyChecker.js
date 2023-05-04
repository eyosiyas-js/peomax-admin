module.exports = async function (req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const expectedApiKey = process.env.api_key;

  if (!apiKey) {
    res.status(401).json({ error: "API key not provided" });
  } else if (apiKey !== expectedApiKey) {
    res.status(401).json({ error: "Invalid API key" });
  } else {
    next();
  }
};
