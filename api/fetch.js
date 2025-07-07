import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

export default async function handler(req, res) {
  console.log("🚀 Incoming method:", req.method);
  console.log("📦 Incoming body:", req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { query } = req.body;

  if (!query) {
    console.error("❌ Missing query in body");
    return res.status(400).json({ error: 'No query provided' });
  }

  const session = driver.session({ database: 'neo4j' });

  try {
    const cypherQuery = `
      MATCH (d:Dataset)
      WHERE toLower(d.name) CONTAINS toLower($query)
         OR toLower(d.source) CONTAINS toLower($query)
      RETURN d.name AS name, d.source AS source
      LIMIT 3
    `;

    const result = await session.run(cypherQuery, { query });

    const data = result.records.map(record => ({
      name: record.get('name'),
      source: record.get('source'),
    }));

    console.log("✅ Results:", data);
    res.status(200).json({ results: data });
  } catch (err) {
    console.error("🔥 Neo4j Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await session.close();
  }
}

// ✅ Vercel config to parse JSON
export const config = {
  api: {
    bodyParser: true,
  },
};
