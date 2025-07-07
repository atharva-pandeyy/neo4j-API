// api/fetch.js
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'neo4j+s://5d37aab9.databases.neo4j.io',
  neo4j.auth.basic('neo4j', 's2lUfeAvejIxQHDySSZNAubPPyd5MC-QGMynCPg0hYs')
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'No message provided' });

  const session = driver.session({ database: 'neo4j' });

  try {
    const cypherQuery = `
      MATCH (d:Dataset)
      WHERE toLower(d.title) CONTAINS toLower($query)
      RETURN d.title AS title, d.content AS content, d.url AS url
      LIMIT 3
    `;

    const result = await session.run(cypherQuery, { query: message });

    const data = result.records.map(record => ({
      title: record.get('title'),
      content: record.get('content'),
      url: record.get('url'),
    }));

    res.status(200).json({ results: data });
  } catch (err) {
    console.error('Neo4j error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await session.close();
  }
}
