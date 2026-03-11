export default async function handler(req, res) {
  const parkId = req.query.park;
  if (!parkId || !["16", "17"].includes(parkId)) {
    return res.status(400).json({ error: "Invalid park ID. Use 16 (Disneyland) or 17 (DCA)." });
  }
  try {
    const response = await fetch(`https://queue-times.com/parks/${parkId}/queue_times.json`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Queue-Times returned ${response.status}` });
    }
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
