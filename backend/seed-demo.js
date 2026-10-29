/* eslint-disable */
// ─────────────────────────────────────────────────────────────────────────────
// Norvex demo data seeder
//
//   node seed-demo.js            -> adds demo data (asks for confirmation)
//   node seed-demo.js --yes      -> same, without asking
//   node seed-demo.js --reset    -> removes ONLY the demo data added by this script
//   node seed-demo.js --fresh    -> reset + seed again
//
// Every demo document carries  __demo: true , so --reset never touches your real data.
// Run it from the norvex-backend folder (it reads MONGO_URI from .env).
// ─────────────────────────────────────────────────────────────────────────────
const zlib = require('zlib');

const DEMO_PASSWORD = 'Demo@12345';

// ───────────────────────── PNG generator (no dependencies) ─────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function encodePng(w, h, px) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0;
    for (let x = 0; x < w; x++) {
      const c = px(x, y);
      raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

const PALETTES = [
  { sky1: [120, 178, 232], sky2: [214, 235, 250], wall: [244, 232, 210], roof: [176, 74, 60], ground: [104, 160, 92] },
  { sky1: [250, 170, 120], sky2: [254, 226, 190], wall: [250, 246, 238], roof: [96, 84, 100], ground: [150, 170, 96] },
  { sky1: [92, 140, 200], sky2: [182, 212, 240], wall: [220, 226, 232], roof: [60, 76, 110], ground: [88, 146, 104] },
  { sky1: [150, 120, 200], sky2: [232, 210, 240], wall: [248, 236, 224], roof: [140, 84, 70], ground: [120, 162, 100] },
  { sky1: [70, 160, 190], sky2: [190, 232, 238], wall: [238, 240, 226], roof: [190, 110, 70], ground: [200, 188, 130] },
];

// kind: 'house' | 'building' | 'land'
function scene(kind, pal, seed, W = 640, H = 400) {
  const horizon = 0.78 * H;
  const hash = (a, b) => ((a * 73856093) ^ (b * 19349663) ^ (seed * 83492791)) >>> 0;
  return (x, y) => {
    // sky
    let c = mix(pal.sky1, pal.sky2, y / horizon);
    // sun
    const sx = 0.82 * W, sy = 0.18 * H, sr = 0.065 * W;
    if ((x - sx) ** 2 + (y - sy) ** 2 < sr * sr) c = [255, 236, 150];

    if (kind === 'house') {
      const left = 0.25 * W, right = 0.75 * W, top = 0.48 * H;
      if (y >= top && y < horizon && x >= left && x < right) c = pal.wall;
      const apexY = 0.22 * H;
      if (y >= apexY && y < top) {
        const half = ((y - apexY) / (top - apexY)) * 0.31 * W;
        if (Math.abs(x - 0.5 * W) <= half) c = pal.roof;
      }
      if (y >= 0.6 * H && y < horizon && x >= 0.46 * W && x < 0.54 * W) c = [112, 78, 52]; // door
      if (y >= 0.54 * H && y < 0.65 * H && ((x >= 0.31 * W && x < 0.39 * W) || (x >= 0.61 * W && x < 0.69 * W))) c = [170, 210, 236]; // windows
    } else if (kind === 'building') {
      const left = 0.3 * W, right = 0.7 * W, top = 0.12 * H;
      if (y >= top && y < horizon && x >= left && x < right) {
        c = pal.wall;
        const cols = 5, rows = 7;
        const cw = (right - left) / cols, rh = (horizon - top - 0.1 * H) / rows;
        const cx = Math.floor((x - left) / cw), cy = Math.floor((y - top - 0.03 * H) / rh);
        const fx = ((x - left) % cw) / cw, fy = ((y - top - 0.03 * H) % rh) / rh;
        if (cy >= 0 && cy < rows && fx > 0.22 && fx < 0.78 && fy > 0.2 && fy < 0.75) {
          c = hash(cx, cy) % 3 === 0 ? [255, 222, 140] : [150, 190, 226];
        }
        if (y >= 0.66 * H && x >= 0.46 * W && x < 0.54 * W) c = [90, 100, 112]; // entrance
      }
    } else {
      // land: field rows + fence + tree
      if (y >= 0.5 * H && y < horizon) c = mix(pal.ground, [70, 120, 70], ((Math.floor((y - 0.5 * H) / 14)) % 2) * 0.35);
      if (y >= 0.52 * H && y < 0.6 * H && x % 40 < 6) c = [140, 100, 66]; // fence posts
      if (y >= 0.55 * H && y < 0.57 * H) c = [150, 110, 72]; // fence rail
      const tx = 0.22 * W;
      if (y >= 0.42 * H && y < 0.58 * H && x >= tx - 5 && x < tx + 5) c = [110, 80, 54];
      if ((x - tx) ** 2 + (y - 0.36 * H) ** 2 < (0.09 * W) ** 2) c = [58, 128, 70];
    }

    // ground + path
    if (y >= horizon) {
      c = mix(pal.ground, [60, 110, 64], (y - horizon) / (H - horizon) * 0.5);
      if (kind !== 'land' && x >= 0.44 * W && x < 0.56 * W + (y - horizon) * 0.4) c = [214, 204, 184];
    }
    return c;
  };
}
const makeImage = (kind, i, n) => encodePng(640, 400, scene(kind, PALETTES[(i + n) % PALETTES.length], i * 7 + n));

// ───────────────────────── date helpers ─────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n, day) => {
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  x.setDate(Math.min(day ?? d.getDate(), 28));
  return x;
};

// ───────────────────────── demo data ─────────────────────────
function buildDemo(ObjectId, now = new Date(), hashedPassword = 'HASH') {
  const oid = () => new ObjectId();
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const at = (daysAgo) => addDays(noon, -daysAgo);
  const D = (extra) => ({ __demo: true, ...extra });

  // ── agents
  const agentsRaw = [
    ['Yacine Bouaziz', 'yacine.bouaziz@demo.norvex.dz', '+213 555 12 34 56', 'Senior Agent', 'Algiers', 4.8],
    ['Samira Haddad', 'samira.haddad@demo.norvex.dz', '+213 661 45 78 90', 'Agent', 'Oran', 4.5],
    ['Karim Messaoudi', 'karim.messaoudi@demo.norvex.dz', '+213 770 23 45 67', 'Junior Agent', 'Constantine', 4.2],
  ];
  const agents = agentsRaw.map(([name, email, phone, role, city, rating], i) => D({
    _id: oid(), name, email, phone, role, city, rating,
    properties: 0, activeLeads: 0, visits: 0, closedDeals: 0, revenue: 0,
    createdAt: at(220 - i * 10), updatedAt: at(5), __v: 0,
  }));

  // ── users (login accounts)
  const users = [
    ['Demo Admin', 'demo.admin@demo.norvex.dz', 'admin', null],
    ['Yacine Bouaziz', 'yacine@demo.norvex.dz', 'agent', 0],
    ['Samira Haddad', 'samira@demo.norvex.dz', 'agent', 1],
    ['Karim Messaoudi', 'karim@demo.norvex.dz', 'agent', 2],
  ].map(([name, email, role, ai], i) => D({
    _id: oid(), name, email, password: hashedPassword, role,
    ...(ai !== null ? { agent: agents[ai]._id } : {}),
    createdAt: at(200 - i), updatedAt: at(2), __v: 0,
  }));

  // ── properties
  const propsRaw = [
    // title, type, tx, city, district, price, area, bed, bath, status, agent, description
    ['Modern Apartment F4 — Hydra', 'Apartment', 'Sale', 'Algiers', 'Hydra', 32500000, 120, 3, 2, 'Available', 0, 'Bright F4 on the 3rd floor with a large balcony, parking and 24/7 security.'],
    ['Luxury Villa with Pool — Chéraga', 'Villa', 'Sale', 'Algiers', 'Chéraga', 78000000, 450, 5, 4, 'Reserved', 0, 'Contemporary villa with garden, swimming pool and a separate guest suite.'],
    ['F3 Apartment — Bab Ezzouar', 'Apartment', 'Rent', 'Algiers', 'Bab Ezzouar', 65000, 85, 2, 1, 'Rented', 0, 'Furnished F3 close to the tramway and the university.'],
    ['Office Space — Oran Centre', 'Office', 'Rent', 'Oran', 'Centre Ville', 140000, 110, 0, 1, 'Available', 1, 'Open-space office with meeting room, reception and fibre internet.'],
    ['Family Villa — Es Senia', 'Villa', 'Sale', 'Oran', 'Es Senia', 54000000, 300, 4, 3, 'Sold', 1, 'Spacious family villa with garage and landscaped garden.'],
    ['Studio — Canastel', 'Apartment', 'Rent', 'Oran', 'Canastel', 45000, 38, 1, 1, 'Available', 1, 'Compact studio with sea view, ideal for a single tenant.'],
    ['Commercial Shop — Larbi Ben M\'hidi', 'Commercial', 'Rent', 'Constantine', 'Centre Ville', 180000, 70, 0, 1, 'Available', 2, 'Street-front shop on a busy commercial avenue.'],
    ['Apartment F5 — Zouaghi', 'Apartment', 'Sale', 'Constantine', 'Zouaghi', 28000000, 150, 4, 2, 'Available', 2, 'Large F5 in a quiet residential block, elevator and parking.'],
    ['Land 600 m² — Blida', 'Land', 'Sale', 'Blida', 'Ouled Yaich', 12500000, 600, 0, 0, 'Available', 2, 'Flat residential plot with all permits and utilities nearby.'],
    ['Duplex — Sétif Centre', 'Apartment', 'Sale', 'Sétif', 'Centre', 21000000, 140, 3, 2, 'Reserved', 1, 'Modern duplex with two terraces in the city centre.'],
    ['Beach Villa — Tipaza', 'Villa', 'Sale', 'Tipaza', 'Chenoua', 66000000, 380, 5, 3, 'Available', 0, 'Villa a few minutes from the beach, panoramic terrace.'],
    ['Commercial Local — Annaba', 'Commercial', 'Sale', 'Annaba', 'Centre', 38000000, 90, 0, 1, 'Available', 2, 'Ground-floor commercial local in the heart of Annaba.'],
  ];
  const propertyImages = [];
  const properties = propsRaw.map(([title, type, txType, city, district, price, area, bedrooms, bathrooms, status, ai, description], i) => {
    const _id = oid();
    const kind = type === 'Villa' ? 'house' : type === 'Land' ? 'land' : 'building';
    const imgIds = [0, 1].map((n) => {
      const png = makeImage(kind, i, n);
      const imgId = oid();
      propertyImages.push(D({
        _id: imgId, property: _id, data: png, mimeType: 'image/png', name: `photo-${n + 1}.png`, size: png.length,
        createdAt: at(120 - i * 5), updatedAt: at(120 - i * 5), __v: 0,
      }));
      return String(imgId);
    });
    return D({
      _id, title, type, txType, city, district, price, area, bedrooms, bathrooms, status, description,
      agent: agents[ai]._id, images: imgIds, createdAt: at(150 - i * 8), updatedAt: at(i + 1), __v: 0,
    });
  });
  const P = (i) => properties[i];

  // ── clients  (agent 0: 0-3, agent 1: 4-6, agent 2: 7-9)
  const clientsRaw = [
    ['Amine Cherif', '+213 551 20 30 40', 'amine.cherif@example.dz', 'Villa', 80000000, 'Algiers', 0, 'Active'],
    ['Lina Benali', '+213 552 31 42 53', 'lina.benali@example.dz', 'Apartment', 70000, 'Algiers', 0, 'Active'],
    ['Walid Mansouri', '+213 553 42 53 64', 'walid.mansouri@example.dz', 'Apartment', 35000000, 'Algiers', 0, 'Active'],
    ['Nadia Saidi', '+213 554 53 64 75', 'nadia.saidi@example.dz', 'Villa', 70000000, 'Tipaza', 0, 'Inactive'],
    ['Rachid Boukhalfa', '+213 661 11 22 33', 'rachid.boukhalfa@example.dz', 'Villa', 55000000, 'Oran', 1, 'Active'],
    ['Meriem Kaci', '+213 662 22 33 44', 'meriem.kaci@example.dz', 'Apartment', 22000000, 'Sétif', 1, 'Active'],
    ['Farid Ouali', '+213 663 33 44 55', null, 'Office', 150000, 'Oran', 1, 'Active'],
    ['Sihem Belkacem', '+213 771 44 55 66', 'sihem.belkacem@example.dz', 'Apartment', 30000000, 'Constantine', 2, 'Active'],
    ['Omar Zerrouki', '+213 772 55 66 77', 'omar.zerrouki@example.dz', 'Commercial', 200000, 'Constantine', 2, 'Active'],
    ['Imane Touati', '+213 773 66 77 88', 'imane.touati@example.dz', 'Land', 14000000, 'Blida', 2, 'Active'],
  ];
  const clients = clientsRaw.map(([name, phone, email, interestedIn, budget, preferredCity, ai, status], i) => D({
    _id: oid(), name, phone, ...(email ? { email } : {}), interestedIn, budget, preferredCity,
    agent: agents[ai]._id, status, createdAt: at(170 - i * 12), updatedAt: at(i + 2), __v: 0,
  }));
  const C = (i) => clients[i];

  // ── leads (one shares a phone with a client so the client page shows a linked lead)
  const leadsRaw = [
    // name, phone, email, property, budget, source, stage, agent, daysAgo
    ['Sofiane Hamdi', '+213 550 90 10 20', 'sofiane.hamdi@example.dz', 'Modern Apartment F4 — Hydra', 33000000, 'Website', 'New', 0, 3],
    ['Anis Larbi', '+213 550 91 11 21', null, 'Beach Villa — Tipaza', 65000000, 'Instagram', 'New', 0, 6],
    ['Yasmine Hadjadj', '+213 660 92 12 22', 'yasmine.hadjadj@example.dz', 'Studio — Canastel', 50000, 'Facebook', 'New', 1, 10],
    ['Amine Cherif', '+213 551 20 30 40', 'amine.cherif@example.dz', 'Luxury Villa with Pool — Chéraga', 80000000, 'Referral', 'Negotiation', 0, 18],
    ['Houda Rezig', '+213 661 93 13 23', 'houda.rezig@example.dz', 'Office Space — Oran Centre', 140000, 'Phone', 'Contacted', 1, 25],
    ['Bilal Meziane', '+213 771 94 14 24', null, 'Apartment F5 — Zouaghi', 27000000, 'Website', 'Contacted', 2, 33],
    ['Dalila Ferhat', '+213 550 95 15 25', 'dalila.ferhat@example.dz', 'Beach Villa — Tipaza', 70000000, 'Walk-in', 'Qualified', 0, 41],
    ['Mourad Slimani', '+213 662 96 16 26', 'mourad.slimani@example.dz', 'Duplex — Sétif Centre', 22000000, 'Referral', 'Qualified', 1, 58],
    ['Kenza Bouras', '+213 772 97 17 27', null, 'Commercial Shop — Larbi Ben M\'hidi', 190000, 'Phone', 'Visit Scheduled', 2, 75],
    ['Tarek Naili', '+213 551 98 18 28', 'tarek.naili@example.dz', 'Modern Apartment F4 — Hydra', 34000000, 'Instagram', 'Visit Scheduled', 0, 95],
    ['Radia Mokrani', '+213 663 99 19 29', 'radia.mokrani@example.dz', 'Family Villa — Es Senia', 56000000, 'Website', 'Won', 1, 120],
    ['Lotfi Gacem', '+213 773 90 20 30', null, 'Land 600 m² — Blida', 12000000, 'Other', 'Lost', 2, 150],
  ];
  const leads = leadsRaw.map(([name, phone, email, property, budget, source, stage, ai, daysAgo]) => D({
    _id: oid(), name, phone, ...(email ? { email } : {}), property, budget, source, stage,
    agent: agents[ai]._id, createdAt: at(daysAgo), updatedAt: at(Math.max(0, daysAgo - 2)), __v: 0,
  }));

  // ── visits
  const visitsRaw = [
    // client, property, agent, dayOffset, time, status, notes
    [0, 0, 0, 0, '10:00', 'Scheduled', 'First visit, client wants to see the balcony.'],
    [4, 5, 1, 0, '15:30', 'Scheduled', null],
    [7, 7, 2, 1, '11:00', 'Scheduled', 'Bring the floor plans.'],
    [1, 10, 0, 3, '14:00', 'Scheduled', null],
    [5, 9, 1, 6, '09:30', 'Scheduled', 'Second visit with the family.'],
    [2, 0, 0, -3, '16:00', 'Completed', 'Liked the location, will think about it.'],
    [8, 6, 2, -8, '10:30', 'Completed', 'Interested, asked for the lease terms.'],
    [6, 5, 1, -15, '12:00', 'Cancelled', 'Client postponed.'],
    [9, 8, 2, -22, '09:00', 'No-show', null],
    [3, 1, 0, -40, '11:30', 'Completed', 'Loved the pool.'],
  ];
  const visits = visitsRaw.map(([ci, pi, ai, off, time, status, notes]) => D({
    _id: oid(), client: C(ci)._id, property: P(pi)._id, agent: agents[ai]._id,
    date: ymd(addDays(noon, off)), time, status, ...(notes ? { notes } : {}),
    createdAt: at(Math.max(1, -off + 4)), updatedAt: at(Math.max(0, -off)), __v: 0,
  }));

  // ── contracts + payments (contract.paid = sum of Paid payments)
  const M = (n, day = 5) => ymd(addMonths(noon, n, day));
  const contractsRaw = [
    // prop, client, agent, type, value, startMonthOffset, status, [payments: monthOffset, pct|amount, status, method]
    { p: 1, c: 0, a: 0, type: 'Sale', value: 78000000, start: -5, status: 'Active',
      pays: [[-5, 0.2, 'Paid', 'Bank Transfer'], [-4, 0.2, 'Paid', 'Bank Transfer'], [-3, 0.2, 'Paid', 'Cheque'], [-1, 0.2, 'Paid', 'Bank Transfer'], [1, 0.2, 'Pending', 'Bank Transfer']] },
    { p: 4, c: 4, a: 1, type: 'Sale', value: 54000000, start: -4, status: 'Completed',
      pays: [[-4, 0.4, 'Paid', 'Bank Transfer'], [-3, 0.4, 'Paid', 'Cheque'], [-2, 0.2, 'Paid', 'CCP / Bank']] },
    { p: 2, c: 1, a: 0, type: 'Rent', value: 780000, start: -3, status: 'Active',
      pays: [[-3, 65000, 'Paid', 'Cash'], [-2, 65000, 'Paid', 'Cash'], [-1, 65000, 'Paid', 'Bank Transfer'], [0, 65000, 'Paid', 'Bank Transfer'], [1, 65000, 'Pending', 'Bank Transfer']] },
    { p: 9, c: 5, a: 1, type: 'Sale', value: 21000000, start: -2, status: 'Pending',
      pays: [[-2, 0.1, 'Paid', 'Bank Transfer'], [-1, 0.1, 'Overdue', 'Cheque'], [2, 0.8, 'Pending', 'Bank Transfer']] },
    { p: 7, c: 7, a: 2, type: 'Sale', value: 28000000, start: -1, status: 'Draft', pays: [] },
    { p: 6, c: 8, a: 2, type: 'Rent', value: 2160000, start: -2, status: 'Active',
      pays: [[-2, 180000, 'Paid', 'Cash'], [-1, 180000, 'Overdue', 'Bank Transfer'], [0, 180000, 'Pending', 'Bank Transfer']] },
    { p: 3, c: 6, a: 1, type: 'Rent', value: 1680000, start: -6, status: 'Completed',
      pays: [[-6, 140000, 'Paid', 'Bank Transfer'], [-5, 140000, 'Paid', 'Bank Transfer'], [-4, 140000, 'Paid', 'Cheque'], [-3, 140000, 'Paid', 'Bank Transfer'], [-2, 140000, 'Paid', 'Bank Transfer'], [-1, 140000, 'Paid', 'Bank Transfer']] },
  ];
  const contracts = [];
  const payments = [];
  for (const k of contractsRaw) {
    const _id = oid();
    const startDate = M(k.start);
    const endDate = k.type === 'Rent' ? M(k.start + 12) : undefined;
    let paid = 0;
    k.pays.forEach(([off, amt, status, method], idx) => {
      const amount = amt < 1 ? Math.round(k.value * amt) : amt;
      let dueDate = M(off, 5 + idx);
      const todayStr = ymd(noon);
      // Pending تبقى في المستقبل، Overdue في الماضي، وPaid ما تتدفعش في المستقبل
      if (status === 'Pending' && dueDate < todayStr) dueDate = ymd(addDays(noon, 3 + idx));
      if (status === 'Overdue' && dueDate >= todayStr) dueDate = ymd(addDays(noon, -(10 + idx)));
      const p = {
        _id: oid(), contract: _id, amount, dueDate, method, status,
        createdAt: at(Math.max(1, -off * 30)), updatedAt: at(Math.max(0, -off * 30 - 2)), __v: 0,
      };
      if (status === 'Paid') { p.paidDate = dueDate < todayStr ? dueDate : todayStr; paid += amount; }
      payments.push(D(p));
    });
    contracts.push(D({
      _id, property: P(k.p)._id, client: C(k.c)._id, agent: agents[k.a]._id, type: k.type, value: k.value, paid,
      startDate, ...(endDate ? { endDate } : {}), status: k.status,
      createdAt: at(Math.max(1, -k.start * 30)), updatedAt: at(3), __v: 0,
    }));
  }

  // ── agent counters (consistent with the data above)
  agents.forEach((a) => {
    const mine = (arr) => arr.filter((x) => String(x.agent) === String(a._id));
    const myContracts = mine(contracts);
    a.properties = mine(properties).length;
    a.activeLeads = mine(leads).filter((l) => !['Won', 'Lost'].includes(l.stage)).length;
    a.visits = mine(visits).length;
    a.closedDeals = myContracts.filter((c) => ['Active', 'Completed'].includes(c.status)).length;
    a.revenue = payments
      .filter((p) => p.status === 'Paid' && myContracts.some((c) => String(c._id) === String(p.contract)))
      .reduce((s, p) => s + p.amount, 0);
  });

  return { agents, users, properties, propertyimages: propertyImages, clients, leads, visits, contracts, payments };
}

module.exports = { buildDemo, encodePng, DEMO_PASSWORD };

// ───────────────────────── runner ─────────────────────────
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const readline = require('readline');

  const COLLECTIONS = ['payments', 'contracts', 'visits', 'leads', 'clients', 'propertyimages', 'properties', 'users', 'agents'];
  const args = process.argv.slice(2);
  const has = (f) => args.includes(f);

  const ask = (q) => new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => { rl.close(); res(a.trim().toLowerCase()); });
  });

  (async () => {
    if (!process.env.MONGO_URI) { console.error('MONGO_URI not found in .env (run this from the norvex-backend folder).'); process.exit(1); }
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected to database:', mongoose.connection.name);

    const countDemo = async () => {
      let n = 0;
      for (const c of COLLECTIONS) n += await db.collection(c).countDocuments({ __demo: true });
      return n;
    };

    const reset = async () => {
      for (const c of COLLECTIONS) {
        const r = await db.collection(c).deleteMany({ __demo: true });
        if (r.deletedCount) console.log(`  removed ${String(r.deletedCount).padStart(3)} from ${c}`);
      }
      console.log('Demo data removed (your real data was not touched).');
    };

    if (has('--reset')) {
      if (!has('--yes') && (await ask(`Remove ALL demo data from "${mongoose.connection.name}"? (y/N) `)) !== 'y') { console.log('Cancelled.'); return; }
      await reset();
      return;
    }

    if (has('--fresh')) {
      await reset();
    } else if ((await countDemo()) > 0) {
      console.log('Demo data already exists. Use --reset to remove it, or --fresh to rebuild it.');
      return;
    }

    if (!has('--yes') && (await ask(`Add demo data to "${mongoose.connection.name}"? Real data is not modified. (y/N) `)) !== 'y') { console.log('Cancelled.'); return; }

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
    const data = buildDemo(mongoose.Types.ObjectId, new Date(), hashed);

    // أي إيميل ديمو موجود بالفعل (من غير __demo) يوقف العملية باش ما نخربوش بيانات حقيقية
    const emails = data.users.map((u) => u.email);
    const clash = await db.collection('users').findOne({ email: { $in: emails }, __demo: { $ne: true } });
    if (clash) { console.error('A real user already uses', clash.email, '- aborting.'); process.exit(1); }

    const order = ['agents', 'users', 'properties', 'propertyimages', 'clients', 'leads', 'visits', 'contracts', 'payments'];
    for (const c of order) {
      await db.collection(c).insertMany(data[c]);
      console.log(`  added ${String(data[c].length).padStart(3)} to ${c}`);
    }

    console.log('\nDemo accounts (password for all: ' + DEMO_PASSWORD + ')');
    console.log('  admin : demo.admin@demo.norvex.dz');
    console.log('  agents: yacine@demo.norvex.dz | samira@demo.norvex.dz | karim@demo.norvex.dz');
    console.log('\nRemove it all later with:  node seed-demo.js --reset');
  })()
    .catch((e) => { console.error('Error:', e.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
