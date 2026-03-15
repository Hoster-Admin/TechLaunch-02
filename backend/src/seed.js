const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
const q = (text, params) => pool.query(text, params);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

// Bulk insert helper: INSERT INTO t (cols) VALUES ($1,$2,...) repeated
async function bulkInsert(table, cols, rowsData, onConflict='') {
  if (!rowsData.length) return;
  const chunkSize = 100;
  for (let i=0; i<rowsData.length; i+=chunkSize) {
    const chunk = rowsData.slice(i, i+chunkSize);
    const vals = []; const placeholders = [];
    chunk.forEach((row,ri) => {
      const ph = row.map((_,ci) => `$${ri*cols.length+ci+1}`).join(',');
      placeholders.push(`(${ph})`);
      row.forEach(v => vals.push(v));
    });
    await q(`INSERT INTO ${table} (${cols.join(',')}) VALUES ${placeholders.join(',')} ${onConflict}`, vals).catch(()=>{});
  }
}

const FIRST = ['Ahmed','Mohammed','Fatima','Sara','Omar','Khalid','Nour','Layla','Hassan','Aisha','Ibrahim','Mona','Tariq','Rania','Yousef','Hana','Majed','Dana','Faisal','Lina','Kareem','Maya','Samir','Dina','Walid','Rana','Jad','Nadia','Adel','Sana','Ziad','Huda','Bilal','Amira','Karim','Yasmine','Fahad','Noura','Wael','Reem','Tarek','Ghada','Mazen','Salma','Bassem','Sharif','Lara','Hamad','Riham','Samer'];
const LAST  = ['Al-Rashid','Al-Mansouri','Al-Farsi','Hassan','Ibrahim','Khaled','Omar','Said','Nasser','Jaber','Abdullah','Al-Mutairi','Al-Suwaidi','Qasim','Saleh','Al-Hamdan','Mahmoud','Issa','Karim','Aziz','Al-Ghamdi','Barakat','Haddad','Younis','Nassar','Zaki','Khalil','Badawi','Atef','Sherif'];
const INDUSTRIES = ['Fintech','Edtech','AI & ML','Healthtech','E-Commerce','Logistics','Foodtech','Proptech','Traveltech','Cleantech','Cybersecurity','HR & Work','Media','Dev Tools','Web3'];
const COUNTRIES  = ['Saudi Arabia','UAE','Egypt','Jordan','Kuwait','Qatar','Bahrain','Oman','Morocco','Tunisia','Lebanon','Iraq','Palestine','Turkey'];
const PERSONAS   = ['Founder','Investor','Product Manager','Accelerator','Enthusiast'];
const COLORS     = ['sky','violet','emerald','orange','pink','amber'];
const STAGES     = ['Pre-Seed','Seed','Series A','Series A+','Series B','Growth','Pre-IPO'];
const ENTITY_EMOJIS = {accelerator:'🏢',investor:'💰',venture_studio:'🎯',startup:'🚀'};
const HEADLINES = ['Building the future of MENA finance','Founder & CEO at a deep-tech startup','Investing in early-stage MENA founders','Product person obsessed with growth','Helping founders scale across the region','Angel investor & startup advisor','Building in public from Cairo','Ex-FAANG, now building for the Arab world','Venture partner at a MENA-focused fund','Edtech entrepreneur on a mission','Co-founder of a Series A Fintech','Product lead at a fast-growing startup','Scaling logistics across 12 MENA countries','Healthtech founder changing care delivery','AI researcher turned founder','Leading growth at a proptech unicorn','Building dev tools for the next billion','Open-source advocate & startup builder','Web3 builder from Amman','Serial founder, 3 exits'];
const BIOS = ['Passionate about using technology to solve real problems in the MENA region. Previously worked at Google and Amazon before founding my own startup.','Angel investor with 20+ portfolio companies. Focused on B2B SaaS and deep tech. Always open to meeting exceptional founders.','Product manager with 8 years of experience. Love building products that people actually use. Big fan of lean methodology and rapid iteration.','Running a pan-Arab accelerator program supporting 50+ startups per year. Believer in the MENA startup ecosystem.','Tech enthusiast following the MENA startup scene closely. Sharing insights and curating the best products from the region.','Co-founded three companies in the last decade. Currently building in the Fintech space. Advisor to multiple regional funds.','Venture capital professional focused on seed and Series A. Previously an operator at leading regional tech companies.','Building tools that help Arabic-speaking developers be more productive. Open source contributor and community builder.'];

const PRODUCT_NAMES = ['Tabsira','Naseem','Masaar','Mawjood','Raqeem','Farida','Wajd','Nahda','Majd','Falak','Jood','Badr','Siraj','Watan','Rashed','Zafar','Nida','Hilal','Rowad','Shabab','PayEasy MENA','CareSync Arabia','EduFlow','LogiTrack ME','FoodieHub MENA','PropConnect','TravelArab','GreenMENA','CyberShield','HRFlow Arabia','MediaMENA','DevKit Arab','Chain MENA','FinFlow','HealthAI Arabia','Atheer','Kawthar','Nabhaan','Sama','Zaman'];
const TAGLINES = ['The easiest way to send money across MENA borders','AI-powered healthcare triage for Arabic patients','Learn any skill in Arabic, at your own pace','Real-time logistics tracking for the Arab world','Discover the best restaurants across MENA cities','Find and rent your next home in Saudi Arabia','Book flights and hotels with Arabic customer support','Your carbon footprint tracker for the region','Enterprise cybersecurity built for Arab businesses','HR software designed for MENA labor laws','Short-form video platform celebrating Arab culture','Open-source dev tools with Arabic documentation','Decentralized finance for the unbanked in MENA','B2B payments infrastructure for regional businesses','AI diagnostics trained on Arab patient data','Smart POS system for MENA retail businesses','Freelance marketplace for Arab tech talent','Supply chain visibility for MENA manufacturers','Social commerce platform for Arab micro-businesses','Crypto exchange with Arabic-first UX'];
const DESCRIPTIONS = ['We\'re building the infrastructure for cross-border payments in MENA. Our platform enables businesses to send and receive money in 14 currencies with zero FX fees and same-day settlement. Built for the region\'s unique banking landscape.','An AI-powered platform that helps Arabic-speaking patients describe their symptoms and get matched with the right specialist. Integrated with 200+ clinics across UAE, Saudi, and Egypt.','Comprehensive e-learning platform offering 500+ courses in Arabic. We\'ve partnered with leading universities and corporations to bring professional development to the Arab world.','Real-time visibility into your supply chain. Track shipments, manage warehouses, and optimize last-mile delivery across 12 MENA countries from a single dashboard.','Community-driven restaurant discovery for the MENA region. Find authentic local food, read honest reviews from real diners, and book your table in seconds.','Simplifying the property search experience in Saudi Arabia. Browse 50,000+ verified listings, take virtual tours, and get pre-approved for a mortgage — all in one place.','A developer toolkit specifically designed for building Arabic and RTL apps. Includes UI components, date/time utilities, currency formatters, and an Arabic NLP library.','Enterprise-grade cybersecurity suite built to comply with SAMA, NESA, and NCA regulations. Protecting 300+ financial institutions across the Gulf.'];
const COMMENT_BODIES = ['This is exactly what the MENA region needed. Congrats on the launch!','Been waiting for something like this for years. Finally a product that understands our market.','The UX is so clean and intuitive. My whole team switched within a week.','Incredible traction for such a young product. The team is clearly executing well.','Love the Arabic-first approach. More products should think this way.','We\'ve been using this for 3 months now and it\'s been a game changer for our operations.','The customer support is outstanding. They respond within minutes.','Just recommended this to 10 founders in my network. Must-try product.','The integration with local payment gateways is seamless. Impressive engineering.','This solves a very real pain point I\'ve been struggling with for years.','Signed up last week and already seeing ROI. Highly recommend.','Really well thought out pricing for the MENA market. Accessible for startups.','The team behind this is very responsive and genuinely cares about user feedback.','This is what happens when you build for MENA instead of adapting a Western product.','The mobile app is buttery smooth. Rare to see this quality from a startup.','Used the free tier and immediately upgraded. Worth every dirham.','The founding team has deep domain expertise. You can see it in every feature.','Looking forward to seeing this expand to more countries in the region.','This replaces 3 different tools we were using. Big cost saving for us.','The onboarding flow is excellent. Got our team up and running in 30 minutes.'];
const LAUNCHER_POSTS = ['Just shipped our Arabic NLP engine after 6 months of training data collection. 94% accuracy on dialect recognition. 🎉','We hit 10,000 users this week without spending a single dollar on ads. Word of mouth in the MENA startup community is real.','Big milestone: our first enterprise client in Saudi Arabia just went live. This validates our B2B thesis for the region.','Shipped: real-time currency conversion for 14 MENA currencies. Zero fees. One API call.','Our waiting list just crossed 5,000 founders from 12 countries. Opening beta access next week!','After 18 months of building, we finally have product-market fit. NPS score jumped from 22 to 67 in one quarter.','We\'re launching our Series A. Looking to connect with MENA-focused investors who understand B2B SaaS.','New feature: AI-powered invoice processing in Arabic. Our accounting clients are saving 8 hours per week.','Just published our learnings from building a 2-sided marketplace in Egypt. DM me for the full case study.','We\'re building in public! Sharing our MRR, CAC, and LTV every month. Accountability builds credibility.','Pivoted from B2C to B2B last quarter. Best decision we\'ve made. Revenue 3x in 60 days.','Our Arabic voice assistant just passed the Turing Test with native speakers. Huge moment for the team.','Open sourcing our MENA compliance toolkit today. 200+ regulatory rules for 8 countries. Free for everyone.','Closing our pre-seed round from top MENA angels. If you\'re a founder building in the region, let\'s talk.','Just got accepted into Y Combinator! Proof that MENA founders can compete on the global stage.','Our healthtech platform processed its 100,000th patient consultation. Building for impact, not just metrics.','New integration: we now connect with all major GCC banking APIs. Fintech builders, come build on our platform.','Lesson learned: launching in Saudi Arabia requires a completely different go-to-market than UAE. Sharing our playbook.','We turned down a $2M acquisition offer. We\'re building something much bigger. Stay tuned.','Our edtech platform just partnered with the Saudi Ministry of Education. 4 million students incoming.'];
const SUGGESTIONS = ['Add a feature to filter products by launch date so we can discover what\'s new this week.','It would be great to have a dedicated section for MENA-focused newsletters and content creators.','Please add Arabic language support for the main navigation. Many of our community members prefer Arabic.','A "jobs board" feature where startups can post openings would add huge value to the ecosystem.','Consider adding a weekly digest email highlighting the top products and posts from the community.','The mobile experience needs improvement. The cards are hard to tap on smaller screens.','Add a way to export my bookmarks to a CSV or share them as a public list.','It would be amazing to have video pitches from founders alongside their product listings.','A mentorship matching feature connecting experienced founders with first-time builders would be valuable.','Please add dark mode! Many of us work late at night and the white interface is too bright.','Consider hosting monthly virtual events where featured products can do live demos.','The search feature needs improvement. Sometimes relevant results do not appear.','Add a "trending" tab showing products getting the most engagement this week.','A verified badge system for products that have been vetted by the Tech Launch team would build trust.','It would be helpful to see the founding team\'s backgrounds directly on the product page.','Add a way for investors to mark their investment interest directly on a product page.','The notification system needs to show what specifically changed, not just a generic alert.','Please add support for RTL languages in all text input fields.','A comparison feature to put two similar products side by side would help buyers make decisions.','Add a "founder story" section where the team can share their journey building the product.','It would be great to have startup events and hackathons listed on the platform.','The entity pages need more details about the team and their backgrounds.','Add a way to embed product demos directly on the listing page without leaving the site.','A "request a feature" button on product pages would help founders understand what users want.','Please improve the onboarding flow for new users. It\'s not clear what to do first.','Add an API so developers can access the product directory programmatically.','It would be useful to track which products I\'ve upvoted over time in my profile.','The accelerator and investor sections should be searchable by stage focus.','Add a podcast section featuring conversations with MENA founders and investors.','Please add two-factor authentication for account security.'];
const ACCEL_NAMES = ['MENA Launchpad','Gulf Ventures','ArabVC','Flat6Labs','Brinc Arabia','Cairo Angels','500 Startups ME','Wamda Capital','Endeavor Jordan','AstroLabs','Techstars Dubai','Global Ventures','Algebra Ventures','EFG EV','Silicon Badia','IN5 Tech','Hub71','KAUST Innovation','Aramco Accelerator','Dubai Future'];
const VC_NAMES = ['Wamda Capital','STV','Algebra Ventures','Partech ME','Shorooq Partners','Global Ventures','Nuwa Capital','Sanabil','Mubadala Ventures','Aramco Ventures','ADQ Ventures','Gulf Capital','Jadwa Investment','Beco Capital','Equitrust','Arzan VC','OQAL Group','Hala Ventures','Palm Drive','Vault Ventures'];
const STUDIO_NAMES = ['Impulse Studio','Falconviz Studio','Tenity MENA','Presight AI','R3 Ventures','Dtec Ventures','DIFC Fintech','Seedstars MENA','iMENA Ventures','Inspire Ventures','Arabia Studio','Makanak Studio','Ibtikari Studio','Atlas Studio','Mujtama Ventures'];
const CO_NAMES = ['Tabby','Tamara','Noon','Careem','Anghami','Bayt','Wego','Mrsool','Jahez','Foodics','Lean Tech','Mozn','Mamopay','Paymob','Fawry','Valify','Rabbit','Halan','Swvl','Trella','NowPay','CashCash','Hakbah','Takamol','Sary','Floward','Nana','Salla','Zid','Dawrni'];
const WHY_REASONS = [['Deep MENA market expertise with 15+ years experience','Portfolio of 40+ successful regional startups','Fast decision-making — term sheets in under 2 weeks','Strong network of corporates and LPs in the Gulf','Hands-on support post-investment including hiring'],['Cohort of 15 hand-picked startups every cycle','$100K equity-free grant for accepted startups','4-month intensive program with weekly expert sessions','Access to 300+ mentor network across MENA','Global demo day with top-tier investors'],['Build-to-scale model from ideation to Series A','Dedicated 10-person team embedded with every studio company','Proprietary deal flow from 5 country networks','Average 18-month path from idea to first million in revenue','$2M average investment per company built']];

async function run() {
  const pwHash = await bcrypt.hash('TLMena2026!', 8);
  console.log('Starting seed...');

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  console.log('Inserting 200 users...');
  const userRows = [];
  for (let i=0;i<200;i++) {
    const fn = FIRST[i%FIRST.length], ln = LAST[i%LAST.length];
    const name = `${fn} ${ln}`;
    const handle = `${fn.toLowerCase()}${ln.toLowerCase().replace(/[^a-z]/g,'')}${i}`;
    const email = `${handle}@tlmena-seed.com`;
    const persona = PERSONAS[i%PERSONAS.length];
    const country = COUNTRIES[i%COUNTRIES.length];
    const color = COLORS[i%COLORS.length];
    const headline = HEADLINES[i%HEADLINES.length];
    const bio = BIOS[i%BIOS.length];
    const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${handle}`;
    userRows.push([name,handle,email,pwHash,avatar,color,bio,headline,`https://${handle}.io`,`@${handle}`,`https://linkedin.com/in/${handle}`,country,persona]);
  }
  await bulkInsert('users','name,handle,email,password_hash,avatar_url,avatar_color,bio,headline,website,twitter,linkedin,country,persona'.split(','), userRows, "ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name");

  const { rows: allUsers } = await q("SELECT id FROM users WHERE email LIKE '%@tlmena-seed.com' LIMIT 200");
  const userIds = allUsers.map(r=>r.id);
  console.log(`Got ${userIds.length} user IDs.`);

  // ── 2. ENTITIES ──────────────────────────────────────────────────────────
  console.log('Inserting 200 entities...');
  const usedSlugs = new Set();
  const mkSlug = (name) => {
    let base=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    let slug=base,n=0; while(usedSlugs.has(slug)){n++;slug=`${base}-${n}`;}
    usedSlugs.add(slug); return slug;
  };
  const entityRows = [];
  const buildEntities = (names,type,count) => {
    for(let i=0;i<count;i++){
      const nm=names[i%names.length]+` E${i}`;
      const slug=mkSlug(nm);
      const industry=INDUSTRIES[i%INDUSTRIES.length];
      const country=COUNTRIES[i%COUNTRIES.length];
      const emoji=ENTITY_EMOJIS[type];
      const fy=rnd(2010,2023);
      const stage=STAGES[i%STAGES.length];
      const aum=type==='investor'?`$${rnd(10,500)}M`:null;
      const portfolio=type!=='startup'?rnd(5,80):null;
      const employees=['1–5','6–15','16–30','31–60','61–100'][i%5];
      const why=WHY_REASONS[i%WHY_REASONS.length];
      const desc=`${nm} is a leading ${type.replace('_',' ')} based in ${country}, focused on ${industry}. Founded in ${fy}, we have supported dozens of regional startups and helped them scale across MENA.`;
      entityRows.push([nm,slug,type,emoji,desc,country,industry,stage,employees,fy,aum,portfolio,JSON.stringify(why),`https://linkedin.com/company/${slug}`,`@${slug.replace(/-/g,'')}`,i%4===0,'approved',userIds[i%userIds.length]]);
    }
  };
  buildEntities(ACCEL_NAMES,'accelerator',50);
  buildEntities(VC_NAMES,'investor',50);
  buildEntities(STUDIO_NAMES,'venture_studio',50);
  buildEntities(CO_NAMES,'startup',50);
  await bulkInsert('entities','name,slug,type,logo_emoji,description,country,industry,stage,employees,founded_year,aum,portfolio_count,why_us,linkedin,twitter,verified,status,created_by'.split(','), entityRows, "ON CONFLICT (slug) DO NOTHING");

  const { rows: allEntities } = await q("SELECT id,type FROM entities LIMIT 300");
  const accelIds = allEntities.filter(e=>e.type==='accelerator').map(e=>e.id);
  const invIds   = allEntities.filter(e=>e.type==='investor').map(e=>e.id);
  console.log(`Got ${allEntities.length} entity IDs.`);

  // ── 3. PRODUCTS ──────────────────────────────────────────────────────────
  console.log('Inserting 200 products...');
  const productRows = [];
  const statusList = ['live','live','live','soon','soon'];
  const EMOJIS = ['🚀','💡','⚡','🔥','🌍','💎','🛡️','🤖','📱','💳','🏥','📚','🛒','🚚','🍔','🏠','✈️','♻️','⚙️','⛓️'];
  for(let i=0;i<200;i++){
    const sub=userIds[i%userIds.length];
    const industry=INDUSTRIES[i%INDUSTRIES.length];
    const isWaitlist=i%5===0;
    const isDiscount=i%7===0;
    const st=isWaitlist?'soon':statusList[i%statusList.length];
    const nm=(PRODUCT_NAMES[i%PRODUCT_NAMES.length])+(i>=PRODUCT_NAMES.length?` v${Math.floor(i/PRODUCT_NAMES.length)}`:'');
    const tl=TAGLINES[i%TAGLINES.length];
    let desc=DESCRIPTIONS[i%DESCRIPTIONS.length]+` Optimized for the ${COUNTRIES[i%COUNTRIES.length]} market.`;
    if(isDiscount) desc+='\n\n🏷️ LAUNCH DISCOUNT: Get 40% off for the first 3 months using code TLMENA40. Limited to first 200 signups.';
    const country=COUNTRIES[i%COUNTRIES.length];
    const emoji=EMOJIS[i%EMOJIS.length];
    const ld=isWaitlist?new Date(Date.now()+rnd(7,90)*86400000).toISOString().split('T')[0]:null;
    const feat=i%20===0, ep=i%30===0;
    productRows.push([nm,tl,desc,emoji,industry,`{${country}}`,st,sub,sub,ld,feat,ep]);
  }
  await bulkInsert('products','name,tagline,description,logo_emoji,industry,countries,status,submitted_by,approved_by,launch_date,featured,editors_pick'.split(','), productRows, "ON CONFLICT DO NOTHING");

  const { rows: allProds } = await q("SELECT id,status FROM products ORDER BY created_at LIMIT 300");
  const productIds = allProds.map(p=>p.id);
  const waitlistIds = allProds.filter(p=>p.status==='soon').map(p=>p.id).slice(0,40);
  console.log(`Got ${productIds.length} product IDs. Waitlist candidates: ${waitlistIds.length}`);

  // ── 4. UPVOTES (bulk) ─────────────────────────────────────────────────────
  console.log('Creating upvotes...');
  const votePairs = new Set();
  const voteRows = [];
  for(let u=0;u<200;u++){
    for(let v=0;v<12;v++){
      const pid=productIds[(u*7+v*13)%productIds.length];
      const uid=userIds[u];
      const k=uid+'|'+pid;
      if(!votePairs.has(k)){votePairs.add(k);voteRows.push([uid,pid]);}
    }
  }
  await bulkInsert('upvotes','user_id,product_id'.split(','), voteRows, "ON CONFLICT DO NOTHING");
  console.log(`Inserted ~${voteRows.length} upvote rows.`);

  // ── 5. PRODUCT COMMENTS (bulk) ───────────────────────────────────────────
  console.log('Creating product comments...');
  const commentRows = [];
  for(let i=0;i<200;i++){
    commentRows.push([productIds[i%productIds.length], userIds[(i*3+1)%userIds.length], COMMENT_BODIES[i%COMMENT_BODIES.length]]);
  }
  await bulkInsert('comments','product_id,user_id,body'.split(','), commentRows);
  const { rows: topComments } = await q("SELECT id,product_id FROM comments LIMIT 200");
  console.log(`Got ${topComments.length} top-level comments.`);

  // ── 6. COMMENT REPLIES (bulk) ─────────────────────────────────────────────
  console.log('Creating comment replies...');
  const replies=['Great point! Fully agree.','Totally agree with this.','I had the same experience with my team.','Thanks for sharing this perspective.','This is really helpful feedback.','Couldn\'t have said it better.','The team addressed this in their latest update.','This is the best feature they\'ve built so far.','Looking forward to seeing how this evolves.','Well said — the regional nuance really matters here.'];
  const replyRows = [];
  for(let i=0;i<200;i++){
    const parent=topComments[i%topComments.length];
    replyRows.push([parent.product_id, userIds[(i*7+2)%userIds.length], replies[i%replies.length], parent.id]);
  }
  await bulkInsert('comments','product_id,user_id,body,parent_id'.split(','), replyRows);
  console.log('Created 200 comment replies.');

  // ── 7. BOOKMARKS ─────────────────────────────────────────────────────────
  console.log('Creating bookmarks...');
  const bmRows=[];
  const bmSet=new Set();
  for(let i=0;i<200;i++){
    const uid=userIds[i%200], pid=productIds[(i*5)%productIds.length];
    const k=uid+'|'+pid;
    if(!bmSet.has(k)){bmSet.add(k);bmRows.push([uid,pid]);}
  }
  await bulkInsert('bookmarks','user_id,product_id'.split(','), bmRows, "ON CONFLICT DO NOTHING");

  // ── 8. WAITLIST SIGNUPS ───────────────────────────────────────────────────
  console.log('Creating waitlist signups...');
  const wlRows=[]; const wlSet=new Set();
  for(let i=0;i<200;i++){
    const pid=waitlistIds[i%waitlistIds.length];
    const uid=userIds[(i*4+3)%userIds.length];
    const email=`wl${i}@tlmena-seed.com`;
    const k=pid+'|'+email;
    if(!wlSet.has(k)){wlSet.add(k);wlRows.push([pid,email,uid]);}
  }
  await bulkInsert('waitlist_signups','product_id,email,user_id'.split(','), wlRows, "ON CONFLICT DO NOTHING");
  if(waitlistIds.length){
    for(const pid of waitlistIds.slice(0,20)){
      await q('UPDATE products SET waitlist_count = (SELECT COUNT(*) FROM waitlist_signups WHERE product_id=$1) WHERE id=$1',[pid]).catch(()=>{});
    }
  }
  console.log(`Inserted ~${wlRows.length} waitlist signups.`);

  // ── 9. FOLLOWS ────────────────────────────────────────────────────────────
  console.log('Creating follows...');
  const followRows=[];const followSet=new Set();
  for(let i=0;i<400;i++){
    const a=userIds[i%200], b=userIds[(i*3+50)%200];
    const k=a+'|'+b;
    if(a!==b&&!followSet.has(k)){followSet.add(k);followRows.push([a,b]);}
  }
  await bulkInsert('follows','follower_id,following_id'.split(','), followRows, "ON CONFLICT DO NOTHING");
  console.log(`Inserted ~${followRows.length} follows.`);

  // ── 10. LAUNCHER POSTS ────────────────────────────────────────────────────
  console.log('Creating launcher posts...');
  const TAGS=['Build in Public','Milestone','Launch','Funding','Hiring','Advice','Question','Resource'];
  const lpRows=[];
  for(let i=0;i<200;i++){
    const content=LAUNCHER_POSTS[i%LAUNCHER_POSTS.length]+(i>=LAUNCHER_POSTS.length?` #${Math.floor(i/LAUNCHER_POSTS.length)}`:'');
    lpRows.push([userIds[i%200], content, TAGS[i%TAGS.length]]);
  }
  await bulkInsert('launcher_posts','user_id,content,tag'.split(','), lpRows);
  const { rows: allLPs } = await q("SELECT id FROM launcher_posts ORDER BY created_at LIMIT 300");
  const lpIds = allLPs.map(r=>r.id);
  console.log(`Got ${lpIds.length} launcher post IDs.`);

  // ── 11. LAUNCHER COMMENTS ────────────────────────────────────────────────
  console.log('Creating launcher comments...');
  const lcBodies=['Congrats on this milestone!','This is so inspiring to read.','Would love to learn more about your approach here.','Sharing this with my network right now.','What tech stack are you using?','How are you thinking about monetization?','This is the kind of content I come here for.','Keep building! The region needs more stories like this.','DM me — would love to collaborate.','What was the biggest challenge you faced?','Incredible progress. What\'s next?','This is exactly the kind of transparency the ecosystem needs.','You\'re inspiring so many builders in the region.','What was your biggest learning from this?','The numbers are impressive. How did you acquire the first 1000 users?'];
  const lcRows=[];
  for(let i=0;i<200;i++){
    lcRows.push([lpIds[i%lpIds.length], userIds[(i*5+4)%200], lcBodies[i%lcBodies.length]]);
  }
  await bulkInsert('launcher_post_comments','post_id,user_id,body'.split(','), lcRows);
  console.log('Created 200 launcher comments.');

  // ── 12. LAUNCHER LIKES ───────────────────────────────────────────────────
  console.log('Creating launcher likes...');
  const llPairs=new Set(); const llRows=[];
  for(let i=0;i<300;i++){
    const pid=lpIds[i%lpIds.length], uid=userIds[(i*6)%200];
    const k=pid+'|'+uid;
    if(!llPairs.has(k)){llPairs.add(k);llRows.push([pid,uid]);}
  }
  await bulkInsert('launcher_post_likes','post_id,user_id'.split(','), llRows, "ON CONFLICT DO NOTHING");
  await q("UPDATE launcher_posts lp SET likes_count = (SELECT COUNT(*) FROM launcher_post_likes l WHERE l.post_id=lp.id)").catch(()=>{});
  console.log(`Inserted ~${llRows.length} launcher likes.`);

  // ── 13. ACCELERATOR APPLICATIONS ─────────────────────────────────────────
  console.log('Creating accelerator applications...');
  const pitches=['We are building AI-powered infrastructure for cross-border payments in MENA. Our platform has 500+ beta users and $30K MRR.','Our edtech platform serves 10,000 students across 5 countries. We have strong unit economics and are ready to scale.','We\'ve built a B2B SaaS tool for supply chain management. 20 paying customers, $15K ARR. Seeking mentorship.','A healthtech startup connecting patients with specialists remotely. 1,000+ consultations completed.','Marketplace for freelance tech talent in MENA. $50K GMV in first 3 months. Need help with growth.'];
  const stagesList=['Pre-Seed','Seed','Ideation Stage','MVP','Early Stage'];
  const appRows=[];
  for(let i=0;i<200;i++){
    const eid=accelIds[i%accelIds.length];
    const aid=userIds[(i*2+10)%200];
    const pid=productIds[i%productIds.length];
    appRows.push([aid,eid,pid,PRODUCT_NAMES[i%PRODUCT_NAMES.length]+' Co.',stagesList[i%stagesList.length],pitches[i%pitches.length]]);
  }
  await bulkInsert('accelerator_applications','applicant_id,entity_id,product_id,startup_name,stage,pitch'.split(','), appRows, "ON CONFLICT DO NOTHING");
  console.log('Created 200 accelerator applications.');

  // ── 14. INVESTOR PITCHES ──────────────────────────────────────────────────
  console.log('Creating investor pitches...');
  const pitchRows=[];
  for(let i=0;i<100;i++){
    const iid=invIds[i%invIds.length], fid=userIds[(i*3+5)%200], pid=productIds[i%productIds.length];
    pitchRows.push([fid,iid,pid,`$${rnd(100,2000)}K`,`We are seeking investment to accelerate growth across MENA. Our product has ${rnd(100,5000)} active users and $${rnd(5,50)}K MRR. Ready to scale.`]);
  }
  await bulkInsert('investor_pitches','founder_id,investor_id,product_id,ask_amount,description'.split(','), pitchRows);
  console.log('Created 100 investor pitches.');

  // ── 15. SUGGESTIONS ───────────────────────────────────────────────────────
  console.log('Creating 200 suggestions...');
  const sugRows=[];
  for(let i=0;i<200;i++){
    sugRows.push([userIds[i%200], SUGGESTIONS[i%SUGGESTIONS.length]+(i>=SUGGESTIONS.length?` (${i})`:'')]);
  }
  await bulkInsert('suggestions','user_id,body'.split(','), sugRows);
  console.log('Created 200 suggestions.');

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const [u,e,p,c,uv,f,lp,lc,wl,sg,aa] = await Promise.all([
    q("SELECT COUNT(*) n FROM users WHERE email LIKE '%@tlmena-seed.com'"),
    q("SELECT COUNT(*) n FROM entities"),
    q("SELECT COUNT(*) n FROM products"),
    q("SELECT COUNT(*) n FROM comments"),
    q("SELECT COUNT(*) n FROM upvotes"),
    q("SELECT COUNT(*) n FROM follows"),
    q("SELECT COUNT(*) n FROM launcher_posts"),
    q("SELECT COUNT(*) n FROM launcher_post_comments"),
    q("SELECT COUNT(*) n FROM waitlist_signups WHERE email LIKE '%@tlmena-seed.com'"),
    q("SELECT COUNT(*) n FROM suggestions"),
    q("SELECT COUNT(*) n FROM accelerator_applications"),
  ]);
  // Ensure community tables exist (these may be wiped on Neon reset separately from main schema)
  await q(`CREATE TABLE IF NOT EXISTS community_tags (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL UNIQUE,
    color      TEXT        NOT NULL DEFAULT '#E8621A',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await q(`CREATE TABLE IF NOT EXISTS community_posts (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    type           TEXT        NOT NULL CHECK (type IN ('post','article')),
    status         TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    title          TEXT,
    body           TEXT        NOT NULL DEFAULT '',
    tag_id         UUID,
    author_id      UUID        NOT NULL,
    likes_count    INTEGER     NOT NULL DEFAULT 0,
    comments_count INTEGER     NOT NULL DEFAULT 0,
    views_count    INTEGER     NOT NULL DEFAULT 0,
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await q(`INSERT INTO community_tags (name, color) VALUES
    ('Insight','#7C3AED'),('Opinion','#E8621A'),('Tutorial','#059669'),('News','#2563EB'),('Milestone','#D97706')
    ON CONFLICT (name) DO NOTHING`);

  console.log('\n═══════ SEED COMPLETE ═══════');
  console.log('Seeded users:         ', u.rows[0].n);
  console.log('Total entities:       ', e.rows[0].n);
  console.log('Total products:       ', p.rows[0].n);
  console.log('Total comments:       ', c.rows[0].n);
  console.log('Total upvotes:        ', uv.rows[0].n);
  console.log('Total follows:        ', f.rows[0].n);
  console.log('Launcher posts:       ', lp.rows[0].n);
  console.log('Launcher comments:    ', lc.rows[0].n);
  console.log('Waitlist signups:     ', wl.rows[0].n);
  console.log('Suggestions:          ', sg.rows[0].n);
  console.log('Accelerator apps:     ', aa.rows[0].n);
  await pool.end();
}

run().catch(e=>{console.error('SEED ERROR:',e.message,e.stack);process.exit(1);});
