import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, MapPin, ShieldCheck, Users, WifiOff, Wifi, Sparkles, ArrowUpRight, Plus, X, Package, Truck, Leaf, Menu, CheckCircle2, Clock3, RefreshCw, Languages, Store, ChevronRight, HeartHandshake, LayoutDashboard } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const categories = ['All', 'Handicrafts', 'Honey & food', 'Textiles', 'Produce', 'Tourism experience', 'Traditional food', 'Other'];
const money = value => `ETB ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const fallbackProducts = [
  { _id: 'demo-honey', title: 'Locally Harvested Honey', description: 'Raw honey offered by a local producer group. Ask the producer about harvest details and available quantities.', category: 'Honey & food', producerName: 'Omo Valley Producers Group', location: 'South Omo', price: 450, unit: 'jar', quantity: 60, verified: true, groupName: 'Omo Valley Producers Group', kind: 'product' },
  { _id: 'demo-basket', title: 'Handwoven Storage Basket', description: 'Handmade woven basket. Dimensions and custom orders can be confirmed directly with the artisan.', category: 'Handicrafts', producerName: 'Ari Artisan Collective', location: 'South Omo', price: 650, unit: 'basket', quantity: 24, verified: true, groupName: 'Ari Artisan Collective', kind: 'product' },
  { _id: 'demo-textile', title: 'Traditional Textile', description: 'Locally made textile. Color, size and availability should be confirmed before purchase.', category: 'Textiles', producerName: 'Community Textile Makers', location: 'South Omo', price: 900, unit: 'piece', quantity: 15, verified: false, groupName: 'Community Textile Makers', kind: 'product' },
  { _id: 'demo-tour', title: 'Community-led Cultural Visit', description: 'A community-led visit arranged with local hosts. Activities, cultural permissions, duration and inclusions must be agreed before booking.', category: 'Tourism experience', producerName: 'South Omo Local Hosts', location: 'South Omo', price: 1200, unit: 'person', quantity: 10, verified: true, groupName: 'South Omo Local Hosts', kind: 'experience' },
  { _id: 'demo-food', title: 'Traditional Food Order', description: 'Traditional food prepared by local cooks for pre-arranged orders. Ingredients, timing and dietary needs should be confirmed.', category: 'Traditional food', producerName: 'Local Food Makers', location: 'South Omo', price: 300, unit: 'serving', quantity: 40, verified: false, groupName: '', kind: 'product' }
];

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('south-omo-connect', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'localId' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function getDrafts() {
  try { const db = await openDb(); return await new Promise((resolve, reject) => { const r = db.transaction('drafts', 'readonly').objectStore('drafts').getAll(); r.onsuccess = () => resolve(r.result || []); r.onerror = () => reject(r.error); }); }
  catch { return JSON.parse(localStorage.getItem('soc-drafts') || '[]'); }
}
async function putDraft(draft) {
  try { const db = await openDb(); await new Promise((resolve, reject) => { const r = db.transaction('drafts', 'readwrite').objectStore('drafts').put(draft); r.onsuccess = resolve; r.onerror = () => reject(r.error); }); }
  catch { const all = JSON.parse(localStorage.getItem('soc-drafts') || '[]').filter(d => d.localId !== draft.localId); all.push(draft); localStorage.setItem('soc-drafts', JSON.stringify(all)); }
}
async function removeDraft(id) {
  try { const db = await openDb(); await new Promise((resolve, reject) => { const r = db.transaction('drafts', 'readwrite').objectStore('drafts').delete(id); r.onsuccess = resolve; r.onerror = () => reject(r.error); }); }
  catch { localStorage.setItem('soc-drafts', JSON.stringify(JSON.parse(localStorage.getItem('soc-drafts') || '[]').filter(d => d.localId !== id))); }
}

const photos = {
  'Honey & food': 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=900&q=80',
  Handicrafts: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
  Textiles: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=80',
  Produce: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  'Tourism experience': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
  'Traditional food': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
  Other: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80'
};

export default function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [groups, setGroups] = useState([]);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('marketplace');
  const [modal, setModal] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [drafts, setDrafts] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [productForm, setProductForm] = useState({ title: '', producerName: '', category: 'Handicrafts', description: '', price: '', quantity: '1', unit: 'item', location: 'South Omo', groupName: '', kind: 'product' });
  const [orderForm, setOrderForm] = useState({ buyerName: '', buyerContact: '', quantity: '1', notes: '' });
  const [priceForm, setPriceForm] = useState({ materials: '120', labor: '30', packaging: '5', transport: '10', markup: '20', quantity: '1' });
  const [aiForm, setAiForm] = useState({ title: '', category: 'Handicrafts', details: '', language: 'English' });
  const [aiResult, setAiResult] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', location: 'South Omo', members: '', description: '' });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  async function loadData() {
    const [p, g, o, d] = await Promise.all([
      fetch(`${API}/products`).then(r => r.ok ? r.json() : fallbackProducts).catch(() => fallbackProducts),
      fetch(`${API}/groups`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/orders`).then(r => r.ok ? r.json() : []).catch(() => []),
      getDrafts()
    ]);
    setProducts(Array.isArray(p) && p.length ? p : fallbackProducts); setGroups(Array.isArray(g) ? g : []); setOrders(Array.isArray(o) ? o : []); setDrafts(d);
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && `${p.title} ${p.description} ${p.producerName} ${p.location}`.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const totalListings = products.length;
  const verifiedCount = products.filter(p => p.verified).length;
  const totalCost = ['materials', 'labor', 'packaging', 'transport'].reduce((sum, key) => sum + Math.max(0, Number(priceForm[key]) || 0), 0);
  const priceEach = totalCost * (1 + Math.max(0, Number(priceForm.markup) || 0) / 100);
  const totalPrice = priceEach * Math.max(1, Number(priceForm.quantity) || 1);

  function flash(message) { setNotice(message); window.setTimeout(() => setNotice(''), 4200); }
  function setField(setter, key, value) { setter(prev => ({ ...prev, [key]: value })); }

  async function submitProduct(event) {
    event.preventDefault();
    const data = { ...productForm, price: Number(productForm.price), quantity: Number(productForm.quantity), kind: productForm.category === 'Tourism experience' ? 'experience' : productForm.kind };
    if (!data.title.trim() || !data.producerName.trim() || !Number.isFinite(data.price) || data.price < 0) return flash('Add a title, producer name and valid price.');
    setBusy(true);
    if (!online) {
      const draft = { ...data, localId: `draft-${Date.now()}`, savedAt: new Date().toISOString(), syncStatus: 'pending' };
      await putDraft(draft); setDrafts(await getDrafts()); setModal(''); setProductForm({ title: '', producerName: '', category: 'Handicrafts', description: '', price: '', quantity: '1', unit: 'item', location: 'South Omo', groupName: '', kind: 'product' }); setBusy(false); return flash('Draft saved on this device. Reconnect to publish it.');
    }
    try {
      const response = await fetch(`${API}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || 'Could not publish listing.');
      setProducts(prev => [body, ...prev]); setModal(''); setProductForm({ title: '', producerName: '', category: 'Handicrafts', description: '', price: '', quantity: '1', unit: 'item', location: 'South Omo', groupName: '', kind: 'product' }); flash('Listing submitted. It is awaiting verification.');
    } catch (error) {
      const draft = { ...data, localId: `draft-${Date.now()}`, savedAt: new Date().toISOString(), syncStatus: 'pending' };
      await putDraft(draft); setDrafts(await getDrafts()); flash(`${error.message} Saved locally for retry.`); setModal('');
    } finally { setBusy(false); }
  }

  async function syncDrafts() {
    if (!online) return flash('You are offline. Connect to the internet before syncing.');
    setSyncing(true); let synced = 0;
    for (const draft of drafts) {
      try {
        const { localId, savedAt, syncStatus, ...payload } = draft;
        const response = await fetch(`${API}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) continue;
        const saved = await response.json(); setProducts(prev => [saved, ...prev]); await removeDraft(localId); synced++;
      } catch { /* keep draft for next retry */ }
    }
    setDrafts(await getDrafts()); setSyncing(false); flash(synced ? `${synced} draft(s) synchronized. Listings still require verification.` : 'No drafts synchronized. Check the server connection and try again.');
  }

  async function submitOrder(event) {
    event.preventDefault(); if (!selectedProduct) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...orderForm, productId: selectedProduct._id, quantity: Number(orderForm.quantity) }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || 'Order request failed.');
      setOrders(prev => [body, ...prev]); setModal(''); setOrderForm({ buyerName: '', buyerContact: '', quantity: '1', notes: '' }); flash(`Order request recorded: ${body._id}. Payment is not processed by this prototype.`);
    } catch (error) { flash(error.message); }
    finally { setBusy(false); }
  }

  async function verifyProduct(product) {
    try {
      const response = await fetch(`${API}/products/${product._id}/verify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: !product.verified }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || 'Could not update verification.');
      setProducts(prev => prev.map(p => p._id === product._id ? body : p)); flash(body.verified ? 'Listing marked verified.' : 'Verification removed.');
    } catch (error) { flash(error.message); }
  }

  async function generateAi(event) {
    event.preventDefault(); setBusy(true); setAiResult(null);
    try {
      const response = await fetch(`${API}/ai/listing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiForm) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || 'AI request failed.');
      setAiResult(body);
    } catch (error) { setAiResult({ title: aiForm.title, description: `${aiForm.details} Please confirm availability and product details with the producer before publishing.`, mode: 'local-fallback', reviewRequired: true, note: error.message }); }
    finally { setBusy(false); }
  }

  async function createGroup(event) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch(`${API}/groups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...groupForm, members: groupForm.members.split(',').map(s => s.trim()).filter(Boolean) }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || 'Could not create group.');
      setGroups(prev => [body, ...prev]); setGroupForm({ name: '', location: 'South Omo', members: '', description: '' }); setModal(''); flash('Producer group created.');
    } catch (error) { flash(error.message); }
    finally { setBusy(false); }
  }

  const navItems = [
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'groups', label: 'Producer groups', icon: Users },
    { id: 'pricing', label: 'Fair pricing', icon: Package },
    { id: 'ai', label: 'AI assistant', icon: Sparkles },
    { id: 'orders', label: 'Order requests', icon: ShoppingBag },
    { id: 'verify', label: 'Verification', icon: ShieldCheck }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#home" onClick={e => { e.preventDefault(); setActiveTab('marketplace'); }}><span className="brand-mark"><Leaf size={23}/></span><span><b>South Omo</b><small>CONNECT</small></span></a>
      <div className="side-label">WORKSPACE</div>
      <nav>{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}><Icon size={18}/><span>{item.label}</span>{item.id === 'orders' && orders.length > 0 && <em>{orders.length}</em>}</button>; })}</nav>
      <div className="sidebar-bottom">
        <div className={`connection-card ${online ? 'connected' : 'disconnected'}`}><span className="connection-icon">{online ? <Wifi size={16}/> : <WifiOff size={16}/>}</span><div><b>{online ? 'You’re connected' : 'Offline mode'}</b><small>{online ? 'Ready to sync changes' : `${drafts.length} saved draft(s)`}</small></div></div>
        {drafts.length > 0 && <button className="sync-button" onClick={syncDrafts} disabled={!online || syncing}><RefreshCw size={15} className={syncing ? 'spin' : ''}/>{syncing ? 'Syncing…' : 'Sync saved drafts'}</button>}
        <div className="community-note"><HeartHandshake size={19}/><p>Local value.<br/><b>Community first.</b></p></div>
        <small className="prototype-tag">HACKATHON PROTOTYPE · V1.0</small>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><Leaf size={20}/></span><b>South Omo Connect</b></div><div className="breadcrumb">South Omo <ChevronRight size={14}/> <b>{navItems.find(n => n.id === activeTab)?.label || 'Marketplace'}</b></div><div className="top-actions"><span className={`network-pill ${online ? 'is-online' : 'is-offline'}`}><span/>{online ? 'Online' : 'Offline'}</span><button className="avatar" title="Demo workspace">SO</button></div></header>
      <div className="page-content">
        {activeTab === 'marketplace' && <>
          <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> LOCAL PEOPLE. DIRECT CONNECTIONS.</div><h1>Discover the value<br/>of <i>South Omo.</i></h1><p>A community-powered marketplace for authentic local products and tourism experiences. Discover local makers, connect directly, and support livelihoods.</p><div className="hero-actions"><button className="btn btn-light" onClick={() => document.getElementById('market-grid')?.scrollIntoView({ behavior: 'smooth' })}>Explore marketplace <ArrowUpRight size={16}/></button><button className="btn btn-outline-light" onClick={() => setModal('listing')}><Plus size={16}/> List an offer</button></div><div className="hero-proof"><span><ShieldCheck size={15}/> Community verification</span><span><Users size={15}/> Collective selling</span></div></div><div className="hero-art"><img src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=85" alt="Landscape in East Africa"/><div className="floating-card"><span className="floating-icon"><MapPin size={17}/></span><span><b>Rooted in South Omo</b><small>Local products · Local experiences</small></span></div><div className="hero-stamp"><Leaf size={20}/><span>LOCAL<br/>FIRST</span></div></div></section>
          <section className="stats-row"><div className="stat"><span className="stat-icon green"><Store size={18}/></span><div><strong>{totalListings}</strong><small>Marketplace offers</small></div></div><div className="stat"><span className="stat-icon amber"><ShieldCheck size={18}/></span><div><strong>{verifiedCount}</strong><small>Verified demo offers</small></div></div><div className="stat"><span className="stat-icon blue"><Users size={18}/></span><div><strong>{groups.length}</strong><small>Producer groups</small></div></div><div className="stat"><span className="stat-icon purple"><ShoppingBag size={18}/></span><div><strong>{orders.length}</strong><small>Order requests</small></div></div></section>
          <section id="market-grid" className="market-section"><div className="section-heading"><div><div className="eyebrow dark">MADE HERE. SHARED WITH THE WORLD.</div><h2>Explore the marketplace</h2><p>Discover products and experiences offered by local producers and community hosts.</p></div><button className="btn btn-primary" onClick={() => setModal('listing')}><Plus size={16}/> Add a listing</button></div>
            <div className="search-tools"><label className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, makers, experiences…"/><kbd>⌕</kbd></label><div className="category-pills">{categories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
            {filtered.length ? <div className="product-grid">{filtered.map((p, i) => <article className="product-card" key={p._id}><div className="product-image"><img src={p.imageUrl || photos[p.category] || photos.Other} alt={p.title} loading="lazy" onError={e => { e.currentTarget.src = photos.Other; }}/><span className="category-label">{p.category}</span><button className="save-icon" title="Demo bookmark" onClick={() => flash('Saved for this demo session.')}>♡</button></div><div className="product-body"><div className="producer-line"><span className="producer-avatar">{p.producerName?.slice(0, 1) || 'P'}</span><span>{p.producerName}</span>{p.verified && <ShieldCheck size={15} className="verified-icon" title="Verified listing"/>}</div><h3>{p.title}</h3><p className="product-description">{p.description}</p><div className="product-meta"><span><MapPin size={13}/>{p.location || 'South Omo'}</span><span>{p.quantity} {p.unit || 'available'}</span></div><div className="product-bottom"><div><strong>{money(p.price)}</strong><small>/ {p.unit || 'unit'}</small></div><button className="card-arrow" aria-label={`Request ${p.title}`} onClick={() => { setSelectedProduct(p); setOrderForm({ buyerName: '', buyerContact: '', quantity: '1', notes: '' }); setModal('order'); }}><ArrowUpRight size={18}/></button></div></div></article>)}</div> : <div className="empty-state"><Search size={26}/><h3>No matching offers</h3><p>Try another search term or category.</p><button className="btn btn-primary" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</button></div>}
            <div className="demo-disclaimer"><ShieldCheck size={16}/><span>Demo listings and prices are illustrative. Confirm availability, origin, cultural permissions and final terms directly before any transaction.</span></div>
          </section>
        </>}

        {activeTab === 'groups' && <section className="content-page"><PageTitle eyebrow="SELL BETTER, TOGETHER" title="Producer groups" subtitle="Bring local supply together, negotiate bulk orders and coordinate shared transportation." action={<button className="btn btn-primary" onClick={() => setModal('group')}><Plus size={16}/> Create a group</button>}/><div className="info-banner"><Users size={19}/><div><b>Collective selling creates shared opportunity.</b><p>Pool quantities, show a combined offer to buyers, and discuss one transport plan instead of arranging every delivery separately.</p></div></div><div className="group-grid">{groups.map((g, i) => <article className="group-card" key={g._id}><div className="group-top"><div className={`group-icon tone-${i % 3}`}><Users size={22}/></div><span className="status-tag">Active demo</span></div><h3>{g.name}</h3><p>{g.description || 'A local producer group coordinating product availability and shared selling.'}</p><div className="group-location"><MapPin size={14}/>{g.location || 'South Omo'}</div><div className="member-list"><b>Members / categories</b><div>{(g.members || []).length ? g.members.map((m, j) => <span key={j}>{m}</span>) : <span>Members not listed</span>}</div></div><button className="btn btn-secondary full" onClick={() => { setActiveTab('pricing'); flash(`Use Fair pricing to calculate a group quote for ${g.name}.`); }}>Prepare group quote <ArrowUpRight size={15}/></button></article>)}</div><div className="panel pricing-panel"><div><div className="eyebrow dark">COLLECTIVE ORDER WORKFLOW</div><h3>Plan a bulk sale</h3><p>Use the pricing calculator to combine per-unit costs, shared transport, packaging and markup into a clear quotation.</p></div><button className="btn btn-primary" onClick={() => setActiveTab('pricing')}>Open pricing calculator <ChevronRight size={16}/></button></div></section>}

        {activeTab === 'pricing' && <section className="content-page"><PageTitle eyebrow="TRANSPARENT BY DESIGN" title="Fair pricing calculator" subtitle="Estimate the cost of an offer before you agree on a selling price. Enter actual local costs; example values are only a starting point."/><div className="pricing-layout"><form className="panel form-panel" onSubmit={e => { e.preventDefault(); flash('Price estimate calculated. Confirm all costs with the producer group.'); }}><h3><Package size={19}/> Cost breakdown</h3><p className="form-help">All amounts are in Ethiopian birr (ETB).</p><div className="field-grid"><Field label="Materials / unit" prefix="ETB" type="number" value={priceForm.materials} onChange={v => setField(setPriceForm, 'materials', v)}/><Field label="Labor / unit" prefix="ETB" type="number" value={priceForm.labor} onChange={v => setField(setPriceForm, 'labor', v)}/><Field label="Packaging / unit" prefix="ETB" type="number" value={priceForm.packaging} onChange={v => setField(setPriceForm, 'packaging', v)}/><Field label="Transport / unit" prefix="ETB" type="number" value={priceForm.transport} onChange={v => setField(setPriceForm, 'transport', v)}/><Field label="Markup (%)" type="number" value={priceForm.markup} onChange={v => setField(setPriceForm, 'markup', v)}/><Field label="Order quantity" type="number" value={priceForm.quantity} onChange={v => setField(setPriceForm, 'quantity', v)}/></div><div className="form-note"><ShieldCheck size={16}/><span>Show all fees separately. The markup is a planning assumption, not a guaranteed fair market price.</span></div></form><div className="quote-card"><div className="quote-label">ESTIMATED QUOTATION</div><div className="quote-total">{money(totalPrice)}</div><div className="quote-sub">Total for {Math.max(1, Number(priceForm.quantity) || 1)} unit(s)</div><div className="quote-divider"/><div className="quote-line"><span>Cost per unit</span><b>{money(totalCost)}</b></div><div className="quote-line"><span>Markup per unit</span><b>{money(priceEach - totalCost)}</b></div><div className="quote-line total"><span>Suggested price / unit</span><b>{money(priceEach)}</b></div><div className="quote-foot"><CheckCircle2 size={16}/> Calculated from your inputs</div><button className="btn btn-light full" onClick={() => { setAiForm(prev => ({ ...prev, title: prev.title || 'Local producer group bulk offer', details: `Illustrative price estimate: ${money(priceEach)} per unit for ${Math.max(1, Number(priceForm.quantity) || 1)} units. Confirm all cost inputs and availability.` })); setActiveTab('ai'); }}>Draft a buyer description <Sparkles size={15}/></button></div></div><div className="panel"><h3>Pricing guidance</h3><div className="guidance-grid"><div><b>Include all costs</b><p>Materials, labor, packaging, handling and transport should be counted.</p></div><div><b>Use local evidence</b><p>Compare real buyer quotes and recent transactions where available.</p></div><div><b>Agree as a group</b><p>Make member shares, fees and delivery responsibilities clear before confirming.</p></div></div></div></section>}

        {activeTab === 'ai' && <section className="content-page"><PageTitle eyebrow="AI WITH HUMAN REVIEW" title="Listing assistant" subtitle="Create a clear first draft from details supplied by the producer. Review all generated text before publishing."/><div className="ai-layout"><form className="panel form-panel" onSubmit={generateAi}><div className="ai-heading"><div className="ai-symbol"><Sparkles size={22}/></div><div><h3>Describe your offer</h3><p className="form-help">The assistant must not invent origin, certifications or cultural claims.</p></div></div><Field label="Product or experience name" value={aiForm.title} onChange={v => setField(setAiForm, 'title', v)} placeholder="e.g. Handwoven storage basket" required/><Field label="Category" as="select" value={aiForm.category} onChange={v => setField(setAiForm, 'category', v)} options={categories.filter(c => c !== 'All').map(c => ({ label: c, value: c }))}/><Field label="Language" as="select" value={aiForm.language} onChange={v => setField(setAiForm, 'language', v)} options={[{ label: 'English', value: 'English' }, { label: 'Amharic (review required)', value: 'Amharic' }, { label: 'Other local language (review required)', value: 'a locally validated language' }]}/><label className="field"><span>Producer-provided details</span><textarea rows="5" value={aiForm.details} onChange={e => setField(setAiForm, 'details', e.target.value)} placeholder="Describe materials, size, availability, how it is made, or what a visitor can expect. Include only facts you can confirm."/></label><button className="btn btn-primary full" disabled={busy}><Sparkles size={16}/>{busy ? 'Preparing draft…' : 'Generate listing draft'}</button></form><div className="ai-output panel"><div className="output-header"><div><div className="eyebrow dark">YOUR DRAFT</div><h3>Listing preview</h3></div><span className="review-tag"><Clock3 size={13}/> Review required</span></div>{aiResult ? <><h2>{aiResult.title || aiForm.title}</h2><p className="ai-result-text">{aiResult.description}</p><div className="form-note"><ShieldCheck size={16}/><span>{aiResult.note || 'Check every detail, then edit as needed before publishing.'}</span></div><button className="btn btn-primary full" onClick={() => { setProductForm(prev => ({ ...prev, title: aiResult.title || aiForm.title, category: aiForm.category, description: aiResult.description, producerName: prev.producerName })); setModal('listing'); }}>Use draft in listing form <ArrowUpRight size={16}/></button></> : <div className="output-empty"><div className="empty-sparkle"><Sparkles size={26}/></div><h3>Your draft will appear here</h3><p>Enter factual details and generate a first draft. If the AI service is unavailable, a clearly labeled template fallback is used.</p><div className="output-tip"><Languages size={17}/><span>Translations should be reviewed by a fluent local speaker before publication.</span></div></div>}</div></div></section>}

        {activeTab === 'orders' && <section className="content-page"><PageTitle eyebrow="BUYER CONNECTIONS" title="Order requests" subtitle="Track buyer inquiries and requested quantities. This prototype records requests but does not take payments."/><div className="panel table-panel"><div className="table-top"><div><h3>Recent requests</h3><p>{orders.length} request(s) recorded in this demo environment.</p></div><span className="status-tag">Payment disabled</span></div>{orders.length ? <div className="table-scroll"><table><thead><tr><th>Order</th><th>Buyer</th><th>Offer</th><th>Quantity</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map(o => <tr key={o._id}><td className="mono">{String(o._id).slice(-9)}</td><td>{o.buyerName}<small>{o.buyerContact || 'No contact provided'}</small></td><td>{o.productTitle}</td><td>{o.quantity}</td><td><b>{money(o.total)}</b></td><td><span className="request-status"><span/>{o.status || 'requested'}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><ShoppingBag size={28}/><h3>No order requests yet</h3><p>Open the marketplace and use an offer card to submit a sample buyer request.</p><button className="btn btn-primary" onClick={() => setActiveTab('marketplace')}>Browse offers</button></div>}</div></section>}

        {activeTab === 'verify' && <section className="content-page"><PageTitle eyebrow="TRUST AND TRACEABILITY" title="Listing verification" subtitle="Review listings and mark only those that have completed the agreed verification process."/><div className="info-banner"><ShieldCheck size={20}/><div><b>Verification is a process, not just a badge.</b><p>For the hackathon demo, use this control to show the review workflow. In production, protect it behind authenticated admin roles and store verification evidence.</p></div></div><div className="panel verification-list"><div className="table-top"><div><h3>Listings to review</h3><p>{products.filter(p => !p.verified).length} listing(s) currently unverified.</p></div></div>{products.map(p => <div className="verification-row" key={p._id}><img src={p.imageUrl || photos[p.category] || photos.Other} alt=""/><div className="verification-details"><b>{p.title}</b><small>{p.producerName} · {p.category}</small><span>{money(p.price)} / {p.unit}</span></div><span className={`verification-badge ${p.verified ? 'approved' : 'pending'}`}>{p.verified ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>} {p.verified ? 'Verified' : 'Needs review'}</span><button className={`btn ${p.verified ? 'btn-secondary' : 'btn-primary'}`} onClick={() => verifyProduct(p)}>{p.verified ? 'Unverify' : 'Mark verified'}</button></div>)}</div><p className="small-disclaimer">Demo limitation: administrator actions are not authenticated. Do not deploy publicly until authentication and authorization are implemented.</p></section>}

        <footer className="footer"><span>© South Omo Connect · Community-first commerce</span><span><span className="footer-dot"/> Prototype for hackathon evaluation</span></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><div className="modal-card"><div className="modal-header"><div><div className="eyebrow dark">SOUTH OMO CONNECT</div><h2>{modal === 'listing' ? 'Add a marketplace offer' : modal === 'order' ? 'Request an order' : 'Create a producer group'}</h2><p>{modal === 'listing' ? 'New listings start unverified until reviewed.' : modal === 'order' ? 'Send an inquiry to the listed producer. No payment is collected.' : 'Create a group to coordinate shared selling.'}</p></div><button className="close-button" onClick={() => setModal('')} aria-label="Close"><X size={20}/></button></div>
      {modal === 'listing' && <form className="modal-form" onSubmit={submitProduct}><Field label="Offer title" value={productForm.title} onChange={v => setField(setProductForm, 'title', v)} placeholder="Name your product or experience" required/><div className="field-grid"><Field label="Producer / group name" value={productForm.producerName} onChange={v => setField(setProductForm, 'producerName', v)} placeholder="Producer or group" required/><Field label="Category" as="select" value={productForm.category} onChange={v => setField(setProductForm, 'category', v)} options={categories.filter(c => c !== 'All').map(c => ({ label: c, value: c }))}/><Field label="Price (ETB)" type="number" value={productForm.price} onChange={v => setField(setProductForm, 'price', v)} min="0" required/><Field label="Quantity available" type="number" value={productForm.quantity} onChange={v => setField(setProductForm, 'quantity', v)} min="0" required/><Field label="Unit" value={productForm.unit} onChange={v => setField(setProductForm, 'unit', v)} placeholder="item, jar, person…"/><Field label="Location" value={productForm.location} onChange={v => setField(setProductForm, 'location', v)}/></div><Field label="Producer group (optional)" value={productForm.groupName} onChange={v => setField(setProductForm, 'groupName', v)} placeholder="Group name, if applicable"/><label className="field"><span>Description</span><textarea rows="3" value={productForm.description} onChange={e => setField(setProductForm, 'description', e.target.value)} placeholder="Only include details you can confirm."/></label><div className="form-note"><ShieldCheck size={16}/><span>This listing will be unverified until reviewed. If offline, it will be saved as a local draft.</span></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal('')}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : online ? 'Submit listing' : 'Save offline draft'}</button></div></form>}
      {modal === 'order' && selectedProduct && <form className="modal-form" onSubmit={submitOrder}><div className="order-summary"><img src={selectedProduct.imageUrl || photos[selectedProduct.category] || photos.Other} alt=""/><div><b>{selectedProduct.title}</b><small>{selectedProduct.producerName}</small><strong>{money(selectedProduct.price)} / {selectedProduct.unit}</strong></div></div><Field label="Buyer / organization name" value={orderForm.buyerName} onChange={v => setField(setOrderForm, 'buyerName', v)} placeholder="Your name or business" required/><div className="field-grid"><Field label="Contact (optional)" value={orderForm.buyerContact} onChange={v => setField(setOrderForm, 'buyerContact', v)} placeholder="Phone or email"/><Field label={`Quantity (max ${selectedProduct.quantity})`} type="number" value={orderForm.quantity} onChange={v => setField(setOrderForm, 'quantity', v)} min="1" max={selectedProduct.quantity} required/></div><label className="field"><span>Notes / delivery questions</span><textarea rows="3" value={orderForm.notes} onChange={e => setField(setOrderForm, 'notes', e.target.value)} placeholder="Ask about availability, collection or delivery."/></label><div className="order-total"><span>Estimated order value</span><b>{money(Number(orderForm.quantity || 0) * Number(selectedProduct.price))}</b></div><div className="form-note"><Clock3 size={16}/><span>This creates a request only. Price, availability, delivery and payment terms must be confirmed with the seller.</span></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal('')}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Send order request'}</button></div></form>}
      {modal === 'group' && <form className="modal-form" onSubmit={createGroup}><Field label="Group / cooperative name" value={groupForm.name} onChange={v => setField(setGroupForm, 'name', v)} placeholder="Enter group name" required/><Field label="Location" value={groupForm.location} onChange={v => setField(setGroupForm, 'location', v)} required/><Field label="Members or product categories" value={groupForm.members} onChange={v => setField(setGroupForm, 'members', v)} placeholder="Honey producers, artisans (comma separated)"/><label className="field"><span>Group description</span><textarea rows="3" value={groupForm.description} onChange={e => setField(setGroupForm, 'description', e.target.value)} placeholder="What does the group produce or offer?"/></label><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal('')}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create group'}</button></div></form>}
    </div></div>}
    {notice && <div className="toast"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={16}/></button></div>}
  </div>;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false, min, max, prefix, as, options = [] }) {
  return <label className="field"><span>{label}</span>{as === 'select' ? <select value={value} onChange={e => onChange(e.target.value)} required={required}>{options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}</select> : <div className={prefix ? 'input-prefix' : ''}>{prefix && <span>{prefix}</span>}<input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} min={min} max={max} step={type === 'number' ? 'any' : undefined}/></div>}</label>;
}
function PageTitle({ eyebrow, title, subtitle, action }) { return <div className="page-title"><div><div className="eyebrow dark">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }
