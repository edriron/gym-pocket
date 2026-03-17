export type ApiItem = {
  name: string
  type: 'product' | 'recipe'
  calories: number
  carbs_g: number
  protein_g: number
  fats_g: number
  measure_g: number
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderApiPage(opts: {
  title: string
  description: string
  currentPath: string   // e.g. '/api/public/products'
  items: ApiItem[]
  keyParam?: string     // forwarded ?key= for nav links
}): Response {
  const { title, description, currentPath, items, keyParam } = opts
  const qs = keyParam ? `?key=${encodeURIComponent(keyParam)}` : ''

  const NAV = [
    { href: '/api/public/products', label: 'Products', dot: '#4f46e5' },
    { href: '/api/public/recipes',  label: 'Recipes',  dot: '#059669' },
    { href: '/api/public/all',      label: 'All',      dot: '#db2777' },
  ]

  const productCount = items.filter(i => i.type === 'product').length
  const recipeCount  = items.filter(i => i.type === 'recipe').length

  const rows = items.map(item => `
    <tr>
      <td class="name">${esc(item.name)}</td>
      <td><span class="type-badge type-${item.type}">${item.type === 'product' ? '📦' : '🍳'} ${item.type}</span></td>
      <td class="num"><span class="cal">${item.calories}</span></td>
      <td class="num"><span class="carb">${item.carbs_g}g</span></td>
      <td class="num"><span class="prot">${item.protein_g}g</span></td>
      <td class="num"><span class="fat">${item.fats_g}g</span></td>
      <td class="num muted">${item.measure_g}g</td>
    </tr>`).join('')

  const json = JSON.stringify(items, null, 2)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} — Gym Pocket API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f6f8fa; --surface: #ffffff; --surface2: #f0f4ff;
      --border: #d0d7de; --text: #1f2328; --muted: #656d76;
      --primary: #4f46e5; --primary-bg: #eef2ff;
      --green: #166534; --green-bg: #dcfce7;
      --row-hover: #f0f6ff;
      --code-bg: #161b22; --code-text: #e6edf3;
      --cal: #dc2626; --carb: #b45309; --prot: #1d4ed8; --fat: #c2410c;
      --r: 8px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117; --surface: #161b22; --surface2: #1c2128;
        --border: #30363d; --text: #e6edf3; --muted: #7d8590;
        --primary: #818cf8; --primary-bg: #1e1b4b;
        --green: #4ade80; --green-bg: #052e16;
        --row-hover: #1c2128;
        --code-bg: #0d1117; --code-text: #e6edf3;
        --cal: #f87171; --carb: #fbbf24; --prot: #60a5fa; --fat: #fb923c;
      }
    }
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; min-height: 100vh; }

    /* ── Header ── */
    .header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; }
    .header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 52px; gap: 12px; }
    .logo { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; color: var(--text); text-decoration: none; }
    .logo-icon { width: 26px; height: 26px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
    .badge-api { background: var(--primary-bg); color: var(--primary); font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; letter-spacing: .04em; text-transform: uppercase; }
    .docs-link { font-size: 12px; color: var(--muted); text-decoration: none; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; transition: color .15s; }
    .docs-link:hover { color: var(--text); }

    /* ── Nav ── */
    .nav { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; overflow-x: auto; }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; }
    .nav-link { display: flex; align-items: center; gap: 6px; padding: 11px 14px; font-size: 13px; font-weight: 500; color: var(--muted); text-decoration: none; border-bottom: 2px solid transparent; white-space: nowrap; transition: color .15s, border-color .15s; }
    .nav-link:hover { color: var(--text); }
    .nav-link.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
    .nav-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

    /* ── Main ── */
    .main { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }

    /* ── Page title ── */
    .page-title { margin-bottom: 20px; }
    .page-title h1 { font-size: 20px; font-weight: 700; letter-spacing: -.01em; }
    .page-title p { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .endpoint-pill { margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r); padding: 5px 12px; font-size: 12px; font-family: 'SF Mono','Cascadia Code',Consolas,monospace; }
    .method { background: var(--green-bg); color: var(--green); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }

    /* ── Stats ── */
    .stats { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 12px 16px; min-width: 110px; }
    .stat-value { font-size: 22px; font-weight: 700; color: var(--primary); letter-spacing: -.02em; }
    .stat-label { font-size: 11px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: .04em; }

    /* ── Table ── */
    .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; margin-bottom: 28px; }
    .table-card table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: var(--surface2); padding: 9px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); border-bottom: 1px solid var(--border); white-space: nowrap; }
    th.num, td.num { text-align: right; }
    tbody tr { border-bottom: 1px solid var(--border); transition: background .1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--row-hover); }
    td { padding: 9px 14px; }
    td.name { font-weight: 500; max-width: 260px; }
    td.num { font-variant-numeric: tabular-nums; font-family: 'SF Mono','Cascadia Code',Consolas,monospace; font-size: 12px; }
    td.muted { color: var(--muted); }
    .type-badge { display: inline-flex; align-items: center; gap: 3px; border-radius: 20px; padding: 2px 8px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .type-product { background: var(--primary-bg); color: var(--primary); }
    .type-recipe  { background: var(--green-bg);   color: var(--green); }
    .cal  { color: var(--cal);  font-weight: 600; }
    .carb { color: var(--carb); font-weight: 600; }
    .prot { color: var(--prot); font-weight: 600; }
    .fat  { color: var(--fat);  font-weight: 600; }
    .empty-row td { text-align: center; padding: 48px; color: var(--muted); font-size: 14px; }

    /* ── Legend ── */
    .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; font-size: 11px; color: var(--muted); }
    .legend span { display: flex; align-items: center; gap: 4px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    /* ── JSON block ── */
    .json-section { margin-top: 8px; }
    .json-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .json-header h2 { font-size: 14px; font-weight: 600; }
    .copy-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: var(--text); font-family: inherit; transition: background .15s; }
    .copy-btn:hover { background: var(--surface2); }
    .code-block { background: var(--code-bg); color: var(--code-text); border-radius: var(--r); padding: 16px; overflow: auto; font-family: 'SF Mono','Cascadia Code',Consolas,monospace; font-size: 12px; line-height: 1.65; max-height: 360px; border: 1px solid var(--border); }

    @media (max-width: 640px) {
      .main { padding: 20px 16px; }
      .header, .nav { padding: 0 16px; }
      thead th:nth-child(n+5), tbody td:nth-child(n+5) { display: none; }
      .stats { gap: 8px; }
      .stat { min-width: 90px; padding: 10px 12px; }
    }
  </style>
</head>
<body>

<div class="header">
  <div class="header-inner">
    <a class="logo" href="/">
      <div class="logo-icon">💪</div>
      Gym Pocket
      <span class="badge-api">Public API</span>
    </a>
    <a class="docs-link" href="/PUBLIC_API.md">Docs ↗</a>
  </div>
</div>

<div class="nav">
  <div class="nav-inner">
    ${NAV.map(n => `
    <a href="${n.href}${qs}" class="nav-link${currentPath === n.href ? ' active' : ''}">
      <span class="nav-dot" style="background:${n.dot}"></span>
      ${n.label}
    </a>`).join('')}
  </div>
</div>

<div class="main">

  <div class="page-title">
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    <div class="endpoint-pill">
      <span class="method">GET</span>
      ${esc(currentPath)}${esc(qs)}
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${items.length}</div>
      <div class="stat-label">Total Items</div>
    </div>
    ${productCount > 0 ? `<div class="stat"><div class="stat-value">${productCount}</div><div class="stat-label">Products</div></div>` : ''}
    ${recipeCount  > 0 ? `<div class="stat"><div class="stat-value">${recipeCount}</div><div class="stat-label">Recipes</div></div>`  : ''}
  </div>

  <div class="legend">
    <span><span class="dot" style="background:var(--cal)"></span> Calories (kcal)</span>
    <span><span class="dot" style="background:var(--carb)"></span> Carbs</span>
    <span><span class="dot" style="background:var(--prot)"></span> Protein</span>
    <span><span class="dot" style="background:var(--fat)"></span> Fats</span>
    <span style="margin-left:auto;font-style:italic">Nutrition values are per <strong>measure_g</strong> grams</span>
  </div>

  <div class="table-card">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th class="num">Calories</th>
          <th class="num">Carbs</th>
          <th class="num">Protein</th>
          <th class="num">Fats</th>
          <th class="num">Measure</th>
        </tr>
      </thead>
      <tbody>
        ${items.length === 0
          ? `<tr class="empty-row"><td colspan="7">No items found.</td></tr>`
          : rows}
      </tbody>
    </table>
  </div>

  <div class="json-section">
    <div class="json-header">
      <h2>JSON Response</h2>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('json').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)">Copy</button>
    </div>
    <pre class="code-block" id="json">${esc(json)}</pre>
  </div>

</div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
