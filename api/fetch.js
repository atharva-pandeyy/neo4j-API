import neo4j from 'neo4j-driver';

// ✅ Init the driver
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// ✅ Vercel API Route Handler
export default async function handler(req, res) {
  console.log("📥 Received method:", req.method);
  console.log("📦 Body received:", req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query in request body' });
  }

  const session = driver.session({ database: 'neo4j' });

  try {
    const cypher = `
      MATCH (d:Dataset)
      WHERE toLower(d.name) CONTAINS toLower($query)
         OR toLower(d.source) CONTAINS toLower($query)
      RETURN d.name AS name, d.source AS source
      LIMIT 3
    `;

    const result = await session.run(cypher, { query });

    const data = result.records.map(record => ({
      name: record.get('name'),
      source: record.get('source'),
    }));

    console.log("✅ Query Results:", data);

    return res.status(200).json({ results: data });
  } catch (err) {
    console.error("🔥 Neo4j query failed:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await session.close();
  }
}

// ✅ Ensure bodyParser is enabled
export const config = {
  api: {
    bodyParser: true,
  },
};
