// api/fetch.js
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'neo4j+s://5d37aab9.databases.neo4j.io', // <--- Replace if URI changes
  neo4j.auth.basic('neo4j', 's2lUfeAvejIxQHDySSZNAubPPyd5MC-QGMynCPg0hYs') // <--- Replace if password changes
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const session = driver.session({ database: 'neo4j' });

  try {
    const cypher = `
      CALL {
        MATCH (n:Dataset)
        WHERE toLower(n.name) CONTAINS toLower($query)
           OR toLower(n.source) CONTAINS toLower($query)
        RETURN n.name AS name, n.source AS info, 'Dataset' AS type
        UNION
        MATCH (n:SatelliteProduct)
        WHERE toLower(n.name) CONTAINS toLower($query)
        RETURN n.name AS name, n.description AS info, 'SatelliteProduct' AS type
        UNION
        MATCH (n:Satellite)
        WHERE toLower(n.name) CONTAINS toLower($query)
        RETURN n.name AS name, n.description AS info, 'Satellite' AS type
        UNION
        MATCH (n:Document)
        WHERE toLower(n.title) CONTAINS toLower($query)
        RETURN n.title AS name, n.url AS info, 'Document' AS type
        UNION
        MATCH (n:Page)
        WHERE toLower(n.title) CONTAINS toLower($query)
        RETURN n.title AS name, n.url AS info, 'Page' AS type
        UNION
        MATCH (n:Phenomenon)
        WHERE toLower(n.name) CONTAINS toLower($query)
        RETURN n.name AS name, '' AS info, 'Phenomenon' AS type
      }
      RETURN name, info, type
      LIMIT 5
    `;

    const result = await session.run(cypher, { query });

    const data = result.records.map(record => ({
      name: record.get('name'),
      info: record.get('info'),
      type: record.get('type')
    }));

    res.status(200).json({ results: data });
  } catch (err) {
    console.error("❌ Neo4j error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await session.close();
  }
}

// Ensure JSON body parsing
export const config = {
  api: {
    bodyParser: true,
  },
};
