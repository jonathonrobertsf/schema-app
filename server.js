/* server.js */
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const BASE = '/schema';

let graph = [];

// Load Schema.org JSON-LD definitions on start
async function loadSchema() {
  try {
    const res = await fetch(
      'https://schema.org/version/latest/schemaorg-current-https.jsonld'
    );
    const json = await res.json();
    graph = json['@graph'];
    console.log(`Loaded ${graph.length} schema definitions`);
  } catch (err) {
    console.error('Failed to load schema definitions:', err);
  }
}
loadSchema();

app.use(express.json());
app.use(BASE, express.static(path.join(__dirname, 'public')));

// List all types
app.get(`${BASE}/api/types`, (req, res) => {
  const types = graph
    .filter(item => item['@type'] === 'rdfs:Class')
    .map(item => item['rdfs:label']);
  res.json(types.sort());
});

// Get properties for a given type
app.get(`${BASE}/api/type/:type`, (req, res) => {
  const type = req.params.type;
  const props = graph
    .filter(item =>
      item['@type'] === 'rdf:Property' &&
      Array.isArray(item['http://schema.org/domainIncludes']) &&
      item['http://schema.org/domainIncludes'].some(d => d['@id'] === `schema:${type}`)
    )
    .map(p => ({
      name: p['rdfs:label'],
      expected: p['http://schema.org/rangeIncludes'] || []
    }));
  res.json(props);
});

// Detect schema types in pasted JSON-LD
app.post(`${BASE}/api/detect`, (req, res) => {
  try {
    const data = req.body;
    const types = [];
    const collect = obj => {
      if (obj['@type']) types.push(obj['@type']);
      Object.values(obj).forEach(v => {
        if (Array.isArray(v)) v.forEach(collect);
        if (v && typeof v === 'object') collect(v);
      });
    };
    collect(data);
    const unique = [...new Set(types)];
    res.json({ types: unique, raw: data });
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON-LD' });
  }
});

app.listen(PORT, () => {
  console.log(`Schema app running at http://localhost:${PORT}${BASE}`);
});