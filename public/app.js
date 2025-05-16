const BASE = '/schema';

// Fetch and populate types
fetch(`${BASE}/api/types`)
  .then(res => res.json())
  .then(types => {
    const sel = document.getElementById('type-select');
    sel.innerHTML = types.map(t => `<option>${t}</option>`).join('');
  });

// Detector logic
document.getElementById('detect-btn').onclick = async () => {
  const input = document.getElementById('detect-input').value;
  try {
    const res = await fetch(`${BASE}/api/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: input
    });
    const { types, raw } = await res.json();
    const acc = document.getElementById('detect-result');
    acc.innerHTML = types.map((type, i) => `
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${i}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${i}">
            ${type}
          </button>
        </h2>
        <div id="collapse${i}" class="accordion-collapse collapse" data-bs-parent="#detect-result">
          <div class="accordion-body"><pre>${JSON.stringify(raw, null, 2)}</pre></div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    alert('Invalid JSON-LD');
  }
};

// Generator: build form
document.getElementById('make-form').onclick = async () => {
  const type = document.getElementById('type-select').value;
  const form = document.getElementById('generator-form');
  form.innerHTML = '';
  const props = await fetch(`${BASE}/api/type/${type}`).then(r => r.json());
  props.forEach(p => {
    const div = document.createElement('div');
    div.className = 'mb-2';
    div.innerHTML = `
      <label class="form-label">${p.name}</label>
      <input name="${p.name}" class="form-control" placeholder="${p.expected.map(e=>e['@id'].replace('schema:','')).join(', ')}">
    `;
    form.append(div);
  });
};

// Generate JSON-LD
document.getElementById('gen-json').onclick = () => {
  const type = document.getElementById('type-select').value;
  const inputs = document.getElementById('generator-form').elements;
  const obj = { '@context': 'https://schema.org', '@type': type };
  Array.from(inputs).forEach(inp => {
    if (inp.value) obj[inp.name] = inp.value;
  });
  document.getElementById('json-output').textContent = JSON.stringify(obj, null, 2);
};