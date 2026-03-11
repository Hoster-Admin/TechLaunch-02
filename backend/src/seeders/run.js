require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding database…');

    // ── Clear existing data (in order)
    await client.query('TRUNCATE platform_posts, team_members, activity_log, refresh_tokens, notifications, waitlist_signups, investor_pitches, accelerator_applications, follows, bookmarks, upvotes, comments, product_media, products, entities, users RESTART IDENTITY CASCADE');

    // ── Users
    const hash = await bcrypt.hash('password123', 12);
    const adminHash = await bcrypt.hash('admin123', 12);

    const usersData = [
      { name:'Super Admin',     handle:'techlaunch_admin', email:'admin@techlaunch.io',    password:adminHash,  persona:'Founder',         role:'admin',     country:'Saudi Arabia', color:'#E15033', verified:true  },
      { name:'Sara Al-Mahmoud', handle:'sara_builds',      email:'sara@example.com',       password:hash,       persona:'Founder',         role:'user',      country:'Saudi Arabia', color:'#E15033', verified:true  },
      { name:'Khalid Al-Rashid',handle:'khalid_vc',        email:'khalid@example.com',     password:hash,       persona:'Investor',        role:'user',      country:'UAE',          color:'#2563eb', verified:true  },
      { name:'Mona Hassan',     handle:'mona_codes',       email:'mona@example.com',       password:hash,       persona:'Product Manager', role:'user',      country:'Egypt',        color:'#7c3aed', verified:false },
      { name:'Ahmed Al-Sayed',  handle:'ahmed_ux',         email:'ahmed@example.com',      password:hash,       persona:'Founder',         role:'user',      country:'Saudi Arabia', color:'#16a34a', verified:false },
      { name:'Layla Karimi',    handle:'layla_startup',    email:'layla@example.com',      password:hash,       persona:'Founder',         role:'user',      country:'UAE',          color:'#d97706', verified:false },
      { name:'Omar Mansour',    handle:'omar_builds',      email:'omar@example.com',       password:hash,       persona:'Founder',         role:'moderator', country:'Jordan',       color:'#0891b2', verified:true  },
      { name:'Nadia Farouk',    handle:'nadia_pm',         email:'nadia@example.com',      password:hash,       persona:'Product Manager', role:'user',      country:'Morocco',      color:'#be185d', verified:false },
      { name:'Yousef Al-Otaibi',handle:'yousef_vc',        email:'yousef@example.com',     password:hash,       persona:'Investor',        role:'user',      country:'Saudi Arabia', color:'#1d4ed8', verified:true  },
      { name:'Reem Al-Zahrani', handle:'reem_founder',     email:'reem@example.com',       password:hash,       persona:'Founder',         role:'user',      country:'Saudi Arabia', color:'#E15033', verified:false },
      { name:'Hassan Badawi',   handle:'new_user_hassan',  email:'hassan@example.com',     password:hash,       persona:'Founder',         role:'user',      country:'Saudi Arabia', color:'#64748b', verified:false },
      { name:'Nour Ibrahim',    handle:'founder_nour',     email:'nour@example.com',       password:hash,       persona:'Founder',         role:'user',      country:'UAE',          color:'#059669', verified:false },
      { name:'Mariam Al-Ali',   handle:'dev_mariam',       email:'mariam@example.com',     password:hash,       persona:'Founder',         role:'user',      country:'Saudi Arabia', color:'#7c3aed', verified:false },
      { name:'Spam Account',    handle:'spam_bot_99',      email:'spam@example.com',       password:hash,       persona:'Enthusiast',      role:'user',      country:'Egypt',        color:'#dc2626', verified:false, status:'suspended' },
    ];

    const userIds = {};
    for (const u of usersData) {
      const { rows } = await client.query(`
        INSERT INTO users (name, handle, email, password_hash, persona, role, country, avatar_color, verified, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [u.name, u.handle, u.email, u.password, u.persona, u.role||'user', u.country, u.color, u.verified||false, u.status||'active']
      );
      userIds[u.handle] = rows[0].id;
    }
    console.log(`  ✅ ${usersData.length} users seeded`);

    // ── Products
    const productsData = [
      { name:'Tabby',        tagline:'Buy now, pay later for the MENA region',          emoji:'💳', industry:'Fintech',    countries:['UAE','Saudi Arabia'],   status:'live',    featured:true,  upvotes:342, by:'sara_builds',    date:'2026-01-12', website:'https://tabby.ai' },
      { name:'Noon Academy', tagline:'Social learning platform for MENA students',      emoji:'📚', industry:'Edtech',     countries:['Saudi Arabia','Egypt'], status:'live',    featured:true,  upvotes:287, by:'khalid_vc',      date:'2026-01-14', website:'https://noonacademy.com' },
      { name:'Vezeeta',      tagline:'Book doctors online across Egypt and MENA',       emoji:'🏥', industry:'Healthtech', countries:['Egypt','UAE'],          status:'live',    featured:false, upvotes:256, by:'mona_codes',     date:'2026-01-15', website:'https://vezeeta.com' },
      { name:'Baraka',       tagline:'Invest in global stocks — zero commission',       emoji:'📈', industry:'Fintech',    countries:['UAE'],                  status:'live',    featured:false, upvotes:231, by:'sara_builds',    date:'2026-01-18', website:'https://getbaraka.com' },
      { name:'Tamara',       tagline:'BNPL for Saudi consumers — Sharia compliant',     emoji:'🛒', industry:'Fintech',    countries:['Saudi Arabia'],         status:'live',    featured:false, upvotes:198, by:'ahmed_ux',       date:'2026-01-20', website:'https://tamara.co' },
      { name:'Kader AI',     tagline:'AI-powered HR for MENA enterprises',              emoji:'🤖', industry:'AI & ML',    countries:['Jordan','Saudi Arabia'], status:'soon',   featured:false, upvotes:167, by:'mona_codes',     date:'2026-01-22', website:'https://kader.ai' },
      { name:'Trella',       tagline:'Digital freight marketplace — shippers & truckers',emoji:'🚛',industry:'Logistics',  countries:['Egypt'],                status:'live',    featured:false, upvotes:154, by:'khalid_vc',      date:'2026-01-25', website:'https://trella.app' },
      { name:'Foodics',      tagline:'Restaurant management & POS for MENA',           emoji:'🍽️', industry:'Foodtech',   countries:['Saudi Arabia','UAE'],    status:'live',    featured:false, upvotes:143, by:'sara_builds',    date:'2026-01-27', website:'https://foodics.com' },
      { name:'Waffarha',     tagline:'Discount coupons and deals platform',             emoji:'🎟️', industry:'E-Commerce', countries:['Egypt'],                status:'live',    featured:false, upvotes:128, by:'ahmed_ux',       date:'2026-02-01', website:'https://waffarha.com' },
      { name:'Cartona',      tagline:'B2B marketplace for informal retail in Egypt',    emoji:'📦', industry:'E-Commerce', countries:['Egypt'],                status:'live',    featured:false, upvotes:112, by:'mona_codes',     date:'2026-02-03', website:'https://cartona.com' },
      { name:'Hala',         tagline:'Super app for ride-hailing in Kuwait',            emoji:'🚕', industry:'Logistics',  countries:['Kuwait'],               status:'live',    featured:false, upvotes:98,  by:'ahmed_ux',       date:'2026-02-05', website:'#' },
      { name:'Cura',         tagline:'Arabic mental health therapy online',             emoji:'🧠', industry:'Healthtech', countries:['Saudi Arabia'],         status:'soon',    featured:false, upvotes:89,  by:'sara_builds',    date:'2026-02-06', website:'https://cura.sa' },
      { name:'Zid',          tagline:'E-commerce platform for Saudi merchants',         emoji:'🏪', industry:'E-Commerce', countries:['Saudi Arabia'],         status:'pending', featured:false, upvotes:0,   by:'new_user_hassan',date:'2026-03-07', website:'https://zid.sa' },
      { name:'Eyewa',        tagline:'Online eyewear retailer across GCC',              emoji:'👓', industry:'E-Commerce', countries:['UAE','Saudi Arabia'],   status:'pending', featured:false, upvotes:0,   by:'founder_nour',   date:'2026-03-08', website:'https://eyewa.com' },
      { name:'Flick',        tagline:'Social media management for MENA brands',         emoji:'📱', industry:'Dev Tools',  countries:['Saudi Arabia'],         status:'pending', featured:false, upvotes:0,   by:'dev_mariam',     date:'2026-03-09', website:'https://flic.kr' },
    ];

    const productIds = {};
    const adminId = userIds['techlaunch_admin'];
    for (const p of productsData) {
      const { rows } = await client.query(`
        INSERT INTO products (name, tagline, logo_emoji, industry, countries, status, featured,
          upvotes_count, submitted_by, approved_by, approved_at, created_at, website)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [ p.name, p.tagline, p.emoji, p.industry, p.countries, p.status, p.featured,
          p.upvotes, userIds[p.by],
          p.status === 'live' ? adminId : null,
          p.status === 'live' ? new Date(p.date) : null,
          new Date(p.date), p.website ]
      );
      productIds[p.name] = rows[0].id;
    }
    console.log(`  ✅ ${productsData.length} products seeded`);

    // ── Entities
    const entitiesData = [
      // Accelerators
      { name:'Flat6Labs',       slug:'flat6labs',       type:'accelerator',    emoji:'🚀', country:'Egypt',        focus:'All Sectors',  stage:'Seed',     portfolio:400, verified:true  },
      { name:'Wamda Capital',   slug:'wamda-capital',   type:'accelerator',    emoji:'💡', country:'UAE',          focus:'Tech',         stage:'Series A', portfolio:60,  verified:true  },
      { name:'AstroLabs',       slug:'astrolabs',       type:'accelerator',    emoji:'🌟', country:'UAE',          focus:'B2B Scale-up', stage:'Scale',    portfolio:300, verified:true  },
      { name:'Brinc MENA',      slug:'brinc-mena',      type:'accelerator',    emoji:'⚡', country:'UAE',          focus:'Hardware/IoT', stage:'Seed',     portfolio:45,  verified:true  },
      { name:'Oasis500',        slug:'oasis500',        type:'accelerator',    emoji:'🌴', country:'Jordan',       focus:'Mobile/SaaS',  stage:'Seed',     portfolio:200, verified:true  },
      { name:'TAQADAM',         slug:'taqadam',         type:'accelerator',    emoji:'🔥', country:'Saudi Arabia', focus:'Deep Tech',    stage:'Pre-Seed', portfolio:60,  verified:true  },
      { name:'Falak Startups',  slug:'falak-startups',  type:'accelerator',    emoji:'🌙', country:'Egypt',        focus:'Tech/Export',  stage:'Seed',     portfolio:80,  verified:true  },
      { name:'i360accelerator', slug:'i360accelerator', type:'accelerator',    emoji:'🎯', country:'Morocco',      focus:'North Africa', stage:'Seed',     portfolio:55,  verified:true  },
      // Investors
      { name:'STV',             slug:'stv',             type:'investor',       emoji:'💼', country:'Saudi Arabia', aum:'$500M+', portfolio:45, verified:true  },
      { name:'500 Global MENA', slug:'500-global-mena', type:'investor',       emoji:'🔢', country:'UAE',          aum:'$30M',   portfolio:120,verified:true  },
      { name:"Wa'ed Ventures",  slug:'waed-ventures',   type:'investor',       emoji:'⚡', country:'Saudi Arabia', aum:'$200M',  portfolio:38, verified:true  },
      { name:'Algebra Ventures',slug:'algebra-ventures',type:'investor',       emoji:'🔬', country:'Egypt',        aum:'$54M',   portfolio:25, verified:true  },
      { name:'BECO Capital',    slug:'beco-capital',    type:'investor',       emoji:'🏦', country:'UAE',          aum:'$100M',  portfolio:35, verified:true  },
      // Venture Studios
      { name:'Misk Innovation',  slug:'misk-innovation',  type:'venture_studio', emoji:'🌙', country:'Saudi Arabia', focus:'Deep Tech · AI',           portfolio:12, verified:true  },
      { name:'Flat6Labs Studio', slug:'flat6labs-studio',  type:'venture_studio', emoji:'🚀', country:'Egypt',        focus:'Fintech · Edtech',          portfolio:8,  verified:true  },
      { name:'Dtec Ventures',    slug:'dtec-ventures',     type:'venture_studio', emoji:'🏗️', country:'UAE',          focus:'Proptech · Smart Cities',   portfolio:15, verified:true  },
      { name:'Riyad Taqnia Fund',slug:'riyad-taqnia-fund', type:'venture_studio', emoji:'🎯', country:'Saudi Arabia', focus:'Industrial · Cleantech',    portfolio:6,  verified:false },
    ];

    const entityIds = {};
    for (const e of entitiesData) {
      const { rows } = await client.query(`
        INSERT INTO entities (name, slug, type, logo_emoji, country, focus, stage, portfolio_count, aum, verified)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [e.name, e.slug, e.type, e.emoji, e.country, e.focus||null, e.stage||null, e.portfolio||0, e.aum||null, e.verified]
      );
      entityIds[e.slug] = rows[0].id;
    }
    console.log(`  ✅ ${entitiesData.length} entities seeded`);

    // ── Accelerator Applications
    const appsData = [
      { applicant:'sara_builds',   entity:'flat6labs',    startup:'Tabby',     stage:'Growth',      status:'accepted',  product:'Tabby'   },
      { applicant:'mona_codes',    entity:'taqadam',      startup:'Kader AI',  stage:'MVP',         status:'reviewing', product:'Kader AI'},
      { applicant:'omar_builds',   entity:'wamda-capital',startup:'Trella',    stage:'Series A+',   status:'reviewing', product:'Trella'  },
      { applicant:'layla_startup', entity:'brinc-mena',   startup:'HealthApp', stage:'MVP',         status:'pending',   product:null      },
      { applicant:'ahmed_ux',      entity:'flat6labs',    startup:'FoodOS',    stage:'Early Stage', status:'pending',   product:null      },
    ];
    for (const a of appsData) {
      await client.query(`
        INSERT INTO accelerator_applications (applicant_id, entity_id, product_id, startup_name, stage, status)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [userIds[a.applicant], entityIds[a.entity], a.product ? productIds[a.product] : null, a.startup, a.stage, a.status]
      );
    }
    console.log(`  ✅ ${appsData.length} accelerator applications seeded`);

    // ── Investor Pitches
    const pitchesData = [
      { founder:'sara_builds', investor:'stv',             product:'Tabby',    ask:'$500K', status:'interested' },
      { founder:'omar_builds', investor:'wamda-capital',   product:'Trella',   ask:'$250K', status:'follow-up'  },
      { founder:'mona_codes',  investor:'500-global-mena', product:'Kader AI', ask:'$150K', status:'sent'       },
    ];
    for (const p of pitchesData) {
      await client.query(`
        INSERT INTO investor_pitches (founder_id, investor_id, product_id, ask_amount, status)
        VALUES ($1,$2,$3,$4,$5)`,
        [userIds[p.founder], entityIds[p.investor], productIds[p.product], p.ask, p.status]
      );
    }
    console.log(`  ✅ ${pitchesData.length} investor pitches seeded`);

    // ── Waitlist signups (for Kader AI + Cura)
    const waitlistEmails = [
      ...Array.from({length:67}, (_,i) => ({ product:'Kader AI', email:`user${i+1}@waitlist.com` })),
      ...Array.from({length:89}, (_,i) => ({ product:'Cura',     email:`cura${i+1}@waitlist.com` })),
    ];
    for (const w of waitlistEmails) {
      await client.query(
        'INSERT INTO waitlist_signups (product_id, email) VALUES ($1,$2)',
        [productIds[w.product], w.email]
      );
    }
    console.log(`  ✅ ${waitlistEmails.length} waitlist signups seeded`);

    // ── Platform posts
    const postsData = [
      { type:'milestone', body:"🎉 Tech Launch just hit 1,000 registered members! Thank you to every builder, investor, and creator who joined our community." },
      { type:'feature',   body:"✨ New: Product pages now support multi-country targeting. Submit your product and choose every MENA country you serve." },
      { type:'update',    body:"📢 We've added 6 new investors to the platform this week — including STV, BECO Capital, and Algebra Ventures." },
      { type:'news',      body:"📰 MENA startup funding reached $3.2B in 2025 — a 28% increase YoY. Tech Launch is proud to have featured 12 of the top 50 funded startups." },
    ];
    for (const p of postsData) {
      await client.query(
        'INSERT INTO platform_posts (type, body, author_id) VALUES ($1,$2,$3)',
        [p.type, p.body, adminId]
      );
    }
    console.log(`  ✅ ${postsData.length} platform posts seeded`);

    // ── Team members
    await client.query(
      'INSERT INTO team_members (user_id, role, added_by) VALUES ($1,$2,$3)',
      [userIds['omar_builds'], 'moderator', adminId]
    );
    console.log('  ✅ Team members seeded');

    // ── Activity log
    const activities = [
      { actor:'sara_builds',   action:'product.submit',  entity:'products', product:'Tabby'        },
      { actor:'techlaunch_admin', action:'product.approve',entity:'products', product:'Foodics'     },
      { actor:'khalid_vc',     action:'user.signup',     entity:'users'                             },
      { actor:'mona_codes',    action:'product.submit',  entity:'products', product:'Kader AI'     },
    ];
    for (const a of activities) {
      await client.query(
        'INSERT INTO activity_log (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
        [userIds[a.actor], a.action, a.entity, a.product ? productIds[a.product] : userIds[a.actor]]
      );
    }
    console.log('  ✅ Activity log seeded');

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Demo credentials:');
    console.log('   Admin:  admin@techlaunch.io / admin123');
    console.log('   User:   sara@example.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
