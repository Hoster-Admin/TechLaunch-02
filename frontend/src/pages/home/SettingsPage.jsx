import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI, entitiesAPI } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const DRAFT_KEY = 'tlmena_draft_product';

/* ── World Dial Codes (comprehensive) ── */
const WORLD_DIALS = [
  {c:'af',f:'🇦🇫',n:'Afghanistan',d:'+93'},{c:'al',f:'🇦🇱',n:'Albania',d:'+355'},{c:'dz',f:'🇩🇿',n:'Algeria',d:'+213'},{c:'ad',f:'🇦🇩',n:'Andorra',d:'+376'},{c:'ao',f:'🇦🇴',n:'Angola',d:'+244'},{c:'ag',f:'🇦🇬',n:'Antigua & Barbuda',d:'+1268'},{c:'ar',f:'🇦🇷',n:'Argentina',d:'+54'},{c:'am',f:'🇦🇲',n:'Armenia',d:'+374'},{c:'au',f:'🇦🇺',n:'Australia',d:'+61'},{c:'at',f:'🇦🇹',n:'Austria',d:'+43'},
  {c:'az',f:'🇦🇿',n:'Azerbaijan',d:'+994'},{c:'bs',f:'🇧🇸',n:'Bahamas',d:'+1242'},{c:'bh',f:'🇧🇭',n:'Bahrain',d:'+973'},{c:'bd',f:'🇧🇩',n:'Bangladesh',d:'+880'},{c:'by',f:'🇧🇾',n:'Belarus',d:'+375'},{c:'be',f:'🇧🇪',n:'Belgium',d:'+32'},{c:'bz',f:'🇧🇿',n:'Belize',d:'+501'},{c:'bj',f:'🇧🇯',n:'Benin',d:'+229'},{c:'bt',f:'🇧🇹',n:'Bhutan',d:'+975'},{c:'bo',f:'🇧🇴',n:'Bolivia',d:'+591'},
  {c:'ba',f:'🇧🇦',n:'Bosnia & Herzegovina',d:'+387'},{c:'bw',f:'🇧🇼',n:'Botswana',d:'+267'},{c:'br',f:'🇧🇷',n:'Brazil',d:'+55'},{c:'bn',f:'🇧🇳',n:'Brunei',d:'+673'},{c:'bg',f:'🇧🇬',n:'Bulgaria',d:'+359'},{c:'bf',f:'🇧🇫',n:'Burkina Faso',d:'+226'},{c:'bi',f:'🇧🇮',n:'Burundi',d:'+257'},{c:'kh',f:'🇰🇭',n:'Cambodia',d:'+855'},{c:'cm',f:'🇨🇲',n:'Cameroon',d:'+237'},{c:'ca',f:'🇨🇦',n:'Canada',d:'+1'},
  {c:'cv',f:'🇨🇻',n:'Cape Verde',d:'+238'},{c:'cf',f:'🇨🇫',n:'Central African Republic',d:'+236'},{c:'td',f:'🇹🇩',n:'Chad',d:'+235'},{c:'cl',f:'🇨🇱',n:'Chile',d:'+56'},{c:'cn',f:'🇨🇳',n:'China',d:'+86'},{c:'co',f:'🇨🇴',n:'Colombia',d:'+57'},{c:'km',f:'🇰🇲',n:'Comoros',d:'+269'},{c:'cd',f:'🇨🇩',n:'Congo (DRC)',d:'+243'},{c:'cg',f:'🇨🇬',n:'Congo (Rep)',d:'+242'},{c:'cr',f:'🇨🇷',n:'Costa Rica',d:'+506'},
  {c:'hr',f:'🇭🇷',n:'Croatia',d:'+385'},{c:'cu',f:'🇨🇺',n:'Cuba',d:'+53'},{c:'cy',f:'🇨🇾',n:'Cyprus',d:'+357'},{c:'cz',f:'🇨🇿',n:'Czech Republic',d:'+420'},{c:'dk',f:'🇩🇰',n:'Denmark',d:'+45'},{c:'dj',f:'🇩🇯',n:'Djibouti',d:'+253'},{c:'dm',f:'🇩🇲',n:'Dominica',d:'+1767'},{c:'do',f:'🇩🇴',n:'Dominican Republic',d:'+1809'},{c:'ec',f:'🇪🇨',n:'Ecuador',d:'+593'},{c:'eg',f:'🇪🇬',n:'Egypt',d:'+20'},
  {c:'sv',f:'🇸🇻',n:'El Salvador',d:'+503'},{c:'gq',f:'🇬🇶',n:'Equatorial Guinea',d:'+240'},{c:'er',f:'🇪🇷',n:'Eritrea',d:'+291'},{c:'ee',f:'🇪🇪',n:'Estonia',d:'+372'},{c:'et',f:'🇪🇹',n:'Ethiopia',d:'+251'},{c:'fj',f:'🇫🇯',n:'Fiji',d:'+679'},{c:'fi',f:'🇫🇮',n:'Finland',d:'+358'},{c:'fr',f:'🇫🇷',n:'France',d:'+33'},{c:'ga',f:'🇬🇦',n:'Gabon',d:'+241'},{c:'gm',f:'🇬🇲',n:'Gambia',d:'+220'},
  {c:'ge',f:'🇬🇪',n:'Georgia',d:'+995'},{c:'de',f:'🇩🇪',n:'Germany',d:'+49'},{c:'gh',f:'🇬🇭',n:'Ghana',d:'+233'},{c:'gr',f:'🇬🇷',n:'Greece',d:'+30'},{c:'gd',f:'🇬🇩',n:'Grenada',d:'+1473'},{c:'gt',f:'🇬🇹',n:'Guatemala',d:'+502'},{c:'gn',f:'🇬🇳',n:'Guinea',d:'+224'},{c:'gw',f:'🇬🇼',n:'Guinea-Bissau',d:'+245'},{c:'gy',f:'🇬🇾',n:'Guyana',d:'+592'},{c:'ht',f:'🇭🇹',n:'Haiti',d:'+509'},
  {c:'hn',f:'🇭🇳',n:'Honduras',d:'+504'},{c:'hk',f:'🇭🇰',n:'Hong Kong',d:'+852'},{c:'hu',f:'🇭🇺',n:'Hungary',d:'+36'},{c:'is',f:'🇮🇸',n:'Iceland',d:'+354'},{c:'in',f:'🇮🇳',n:'India',d:'+91'},{c:'id',f:'🇮🇩',n:'Indonesia',d:'+62'},{c:'ir',f:'🇮🇷',n:'Iran',d:'+98'},{c:'iq',f:'🇮🇶',n:'Iraq',d:'+964'},{c:'ie',f:'🇮🇪',n:'Ireland',d:'+353'},{c:'il',f:'🇮🇱',n:'Israel',d:'+972'},
  {c:'it',f:'🇮🇹',n:'Italy',d:'+39'},{c:'jm',f:'🇯🇲',n:'Jamaica',d:'+1876'},{c:'jp',f:'🇯🇵',n:'Japan',d:'+81'},{c:'jo',f:'🇯🇴',n:'Jordan',d:'+962'},{c:'kz',f:'🇰🇿',n:'Kazakhstan',d:'+7'},{c:'ke',f:'🇰🇪',n:'Kenya',d:'+254'},{c:'kw',f:'🇰🇼',n:'Kuwait',d:'+965'},{c:'kg',f:'🇰🇬',n:'Kyrgyzstan',d:'+996'},{c:'la',f:'🇱🇦',n:'Laos',d:'+856'},{c:'lv',f:'🇱🇻',n:'Latvia',d:'+371'},
  {c:'lb',f:'🇱🇧',n:'Lebanon',d:'+961'},{c:'ls',f:'🇱🇸',n:'Lesotho',d:'+266'},{c:'lr',f:'🇱🇷',n:'Liberia',d:'+231'},{c:'ly',f:'🇱🇾',n:'Libya',d:'+218'},{c:'li',f:'🇱🇮',n:'Liechtenstein',d:'+423'},{c:'lt',f:'🇱🇹',n:'Lithuania',d:'+370'},{c:'lu',f:'🇱🇺',n:'Luxembourg',d:'+352'},{c:'mg',f:'🇲🇬',n:'Madagascar',d:'+261'},{c:'mw',f:'🇲🇼',n:'Malawi',d:'+265'},{c:'my',f:'🇲🇾',n:'Malaysia',d:'+60'},
  {c:'mv',f:'🇲🇻',n:'Maldives',d:'+960'},{c:'ml',f:'🇲🇱',n:'Mali',d:'+223'},{c:'mt',f:'🇲🇹',n:'Malta',d:'+356'},{c:'mr',f:'🇲🇷',n:'Mauritania',d:'+222'},{c:'mu',f:'🇲🇺',n:'Mauritius',d:'+230'},{c:'mx',f:'🇲🇽',n:'Mexico',d:'+52'},{c:'md',f:'🇲🇩',n:'Moldova',d:'+373'},{c:'mc',f:'🇲🇨',n:'Monaco',d:'+377'},{c:'mn',f:'🇲🇳',n:'Mongolia',d:'+976'},{c:'me',f:'🇲🇪',n:'Montenegro',d:'+382'},
  {c:'ma',f:'🇲🇦',n:'Morocco',d:'+212'},{c:'mz',f:'🇲🇿',n:'Mozambique',d:'+258'},{c:'mm',f:'🇲🇲',n:'Myanmar',d:'+95'},{c:'na',f:'🇳🇦',n:'Namibia',d:'+264'},{c:'np',f:'🇳🇵',n:'Nepal',d:'+977'},{c:'nl',f:'🇳🇱',n:'Netherlands',d:'+31'},{c:'nz',f:'🇳🇿',n:'New Zealand',d:'+64'},{c:'ni',f:'🇳🇮',n:'Nicaragua',d:'+505'},{c:'ne',f:'🇳🇪',n:'Niger',d:'+227'},{c:'ng',f:'🇳🇬',n:'Nigeria',d:'+234'},
  {c:'mk',f:'🇲🇰',n:'North Macedonia',d:'+389'},{c:'no',f:'🇳🇴',n:'Norway',d:'+47'},{c:'om',f:'🇴🇲',n:'Oman',d:'+968'},{c:'pk',f:'🇵🇰',n:'Pakistan',d:'+92'},{c:'pa',f:'🇵🇦',n:'Panama',d:'+507'},{c:'pg',f:'🇵🇬',n:'Papua New Guinea',d:'+675'},{c:'py',f:'🇵🇾',n:'Paraguay',d:'+595'},{c:'pe',f:'🇵🇪',n:'Peru',d:'+51'},{c:'ph',f:'🇵🇭',n:'Philippines',d:'+63'},{c:'pl',f:'🇵🇱',n:'Poland',d:'+48'},
  {c:'pt',f:'🇵🇹',n:'Portugal',d:'+351'},{c:'qa',f:'🇶🇦',n:'Qatar',d:'+974'},{c:'ro',f:'🇷🇴',n:'Romania',d:'+40'},{c:'ru',f:'🇷🇺',n:'Russia',d:'+7'},{c:'rw',f:'🇷🇼',n:'Rwanda',d:'+250'},{c:'sa',f:'🇸🇦',n:'Saudi Arabia',d:'+966'},{c:'sn',f:'🇸🇳',n:'Senegal',d:'+221'},{c:'rs',f:'🇷🇸',n:'Serbia',d:'+381'},{c:'sl',f:'🇸🇱',n:'Sierra Leone',d:'+232'},{c:'sg',f:'🇸🇬',n:'Singapore',d:'+65'},
  {c:'sk',f:'🇸🇰',n:'Slovakia',d:'+421'},{c:'si',f:'🇸🇮',n:'Slovenia',d:'+386'},{c:'sb',f:'🇸🇧',n:'Solomon Islands',d:'+677'},{c:'so',f:'🇸🇴',n:'Somalia',d:'+252'},{c:'za',f:'🇿🇦',n:'South Africa',d:'+27'},{c:'ss',f:'🇸🇸',n:'South Sudan',d:'+211'},{c:'es',f:'🇪🇸',n:'Spain',d:'+34'},{c:'lk',f:'🇱🇰',n:'Sri Lanka',d:'+94'},{c:'sd',f:'🇸🇩',n:'Sudan',d:'+249'},{c:'sr',f:'🇸🇷',n:'Suriname',d:'+597'},
  {c:'se',f:'🇸🇪',n:'Sweden',d:'+46'},{c:'ch',f:'🇨🇭',n:'Switzerland',d:'+41'},{c:'sy',f:'🇸🇾',n:'Syria',d:'+963'},{c:'tw',f:'🇹🇼',n:'Taiwan',d:'+886'},{c:'tj',f:'🇹🇯',n:'Tajikistan',d:'+992'},{c:'tz',f:'🇹🇿',n:'Tanzania',d:'+255'},{c:'th',f:'🇹🇭',n:'Thailand',d:'+66'},{c:'tl',f:'🇹🇱',n:'Timor-Leste',d:'+670'},{c:'tg',f:'🇹🇬',n:'Togo',d:'+228'},{c:'tt',f:'🇹🇹',n:'Trinidad & Tobago',d:'+1868'},
  {c:'tn',f:'🇹🇳',n:'Tunisia',d:'+216'},{c:'tr',f:'🇹🇷',n:'Turkey',d:'+90'},{c:'tm',f:'🇹🇲',n:'Turkmenistan',d:'+993'},{c:'ug',f:'🇺🇬',n:'Uganda',d:'+256'},{c:'ua',f:'🇺🇦',n:'Ukraine',d:'+380'},{c:'ae',f:'🇦🇪',n:'UAE',d:'+971'},{c:'gb',f:'🇬🇧',n:'United Kingdom',d:'+44'},{c:'us',f:'🇺🇸',n:'United States',d:'+1'},{c:'uy',f:'🇺🇾',n:'Uruguay',d:'+598'},{c:'uz',f:'🇺🇿',n:'Uzbekistan',d:'+998'},
  {c:'vu',f:'🇻🇺',n:'Vanuatu',d:'+678'},{c:'ve',f:'🇻🇪',n:'Venezuela',d:'+58'},{c:'vn',f:'🇻🇳',n:'Vietnam',d:'+84'},{c:'ye',f:'🇾🇪',n:'Yemen',d:'+967'},{c:'zm',f:'🇿🇲',n:'Zambia',d:'+260'},{c:'zw',f:'🇿🇼',n:'Zimbabwe',d:'+263'},{c:'ps',f:'🇵🇸',n:'Palestine',d:'+970'},{c:'xk',f:'🇽🇰',n:'Kosovo',d:'+383'},
];

const WORLD_COUNTRIES = WORLD_DIALS.map(x => ({ v:x.c, l:`${x.f} ${x.n}` }));

const MAJOR_CITIES = [
  'Abu Dhabi','Abuja','Accra','Addis Ababa','Algiers','Almaty','Amman','Amsterdam','Ankara','Athens',
  'Baghdad','Baku','Bangkok','Barcelona','Beirut','Belgrade','Berlin','Bogotá','Brussels','Budapest',
  'Buenos Aires','Cairo','Cape Town','Casablanca','Chicago','Colombo','Copenhagen','Dakar','Damascus','Dar es Salaam',
  'Delhi','Dhaka','Doha','Dubai','Dublin','Dushanbe','Frankfurt','Geneva','Hamburg','Hanoi',
  'Ho Chi Minh City','Hong Kong','Istanbul','Jakarta','Jeddah','Jerusalem','Johannesburg','Kabul','Karachi','Khartoum',
  'Kyiv','Lagos','Lahore','Lima','Lisbon','London','Los Angeles','Luanda','Lusaka','Madrid',
  'Manila','Maputo','Medina','Melbourne','Mexico City','Milan','Minsk','Mogadishu','Montreal','Moscow',
  'Mumbai','Muscat','Nairobi','New York','Oslo','Paris','Prague','Rabat','Riyadh','Rome',
  'San Francisco','Santiago','São Paulo','Sarajevo','Seoul','Shanghai','Singapore','Sofia','Stockholm','Sydney',
  'Taipei','Tashkent','Tehran','Tel Aviv','Tokyo','Toronto','Tripoli','Tunis','Vienna','Warsaw',
  'Washington DC','Yerevan','Zagreb','Zurich',
];

const PERSONAS = [
  { v:'Founder',         icon:'🚀', desc:'Submit & grow your product' },
  { v:'Investor',        icon:'💰', desc:'Discover MENA deals'        },
  { v:'Builder',         icon:'⚡', desc:'Hack, build, ship'           },
  { v:'Product Manager', icon:'🧠', desc:'Discover & follow launches'  },
  { v:'Accelerator',     icon:'🏢', desc:'List your program'           },
  { v:'Enthusiast',      icon:'⭐', desc:'Follow the ecosystem'        },
  { v:'Venture Studio',  icon:'🏗️', desc:'Co-build startups'           },
];

const NAV_ITEMS = [
  { key:'profile',   icon:'👤', label:'My Profile'         },
  { key:'products',  icon:'🚀', label:'My Products'        },
  { key:'applied',   icon:'📋', label:'Applied'            },
  { key:'messages',  icon:'💬', label:'Messages'           },
  { key:'bookmarks', icon:'🔖', label:'Bookmarks'          },
  { key:'company',   icon:'🏢', label:'Create Entity Page'},
];

const MENA_INDUSTRIES = ['AI & ML','Cleantech','Cybersecurity','Dev Tools','E-Commerce','Edtech','Fintech','Foodtech','Healthtech','HR & Work','Logistics','Media','Proptech','Traveltech','Web3'];
const MENA_COUNTRIES_LIST = [
  { v:'sa', l:'🇸🇦 Saudi Arabia' },{ v:'ae', l:'🇦🇪 UAE' },        { v:'eg', l:'🇪🇬 Egypt'   },
  { v:'jo', l:'🇯🇴 Jordan'       },{ v:'ma', l:'🇲🇦 Morocco' },     { v:'kw', l:'🇰🇼 Kuwait'  },
  { v:'qa', l:'🇶🇦 Qatar'        },{ v:'bh', l:'🇧🇭 Bahrain' },     { v:'tn', l:'🇹🇳 Tunisia' },
  { v:'lb', l:'🇱🇧 Lebanon'      },{ v:'iq', l:'🇮🇶 Iraq'    },     { v:'om', l:'🇴🇲 Oman'    },
  { v:'ly', l:'🇱🇾 Libya'        },{ v:'dz', l:'🇩🇿 Algeria' },     { v:'sy', l:'🇸🇾 Syria'   },
  { v:'ye', l:'🇾🇪 Yemen'        },{ v:'ps', l:'🇵🇸 Palestine'},     { v:'sd', l:'🇸🇩 Sudan'   },
];
const FUNDING_STAGES = ['Ideation Stage','Pre-Seed','Seed','MVP','Early Stage','Series A','Series B','Series C','Pre-IPO','Growth'];

const labelStyle = { display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 };
const inputStyle  = { flex:1, padding:'10px 14px', border:'none', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a', background:'transparent' };
const fieldWrap   = { border:'1.5px solid #e8e8e8', borderRadius:10, overflow:'visible', background:'#fff', display:'flex', alignItems:'center', position:'relative' };

/* ── Searchable Dropdown ── */
function SearchDD({ value, onChange, items, placeholder, renderItem, renderTrigger, matchFn }) {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); }};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = items.filter(i => matchFn ? matchFn(i, q) : JSON.stringify(i).toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', cursor:'pointer', fontSize:14, fontFamily:'Inter,sans-serif', color: value ? '#0a0a0a' : '#aaa', textAlign:'left', gap:8 }}>
        {renderTrigger(value)}
        <span style={{ fontSize:10, color:'#bbb', flexShrink:0 }}>▼</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            style={{ width:'100%', padding:'10px 14px', border:'none', borderBottom:'1px solid #f0f0f0', fontFamily:'Inter,sans-serif', fontSize:13, outline:'none', background:'#fafafa', boxSizing:'border-box' }}/>
          <div style={{ maxHeight:230, overflowY:'auto' }}>
            {filtered.slice(0,80).map((item, i) => (
              <div key={i} onClick={() => { onChange(item); setOpen(false); setQ(''); }}
                style={{ padding:'9px 14px', fontSize:13, fontWeight:500, color:'#333', cursor:'pointer', background: item===value||item?.v===value?'#fff5f3':'transparent', transition:'background .1s' }}
                onMouseOver={e=>e.currentTarget.style.background='#fff5f3'}
                onMouseOut={e=>e.currentTarget.style.background=(item===value||item?.v===value)?'#fff5f3':'transparent'}>
                {renderItem(item)}
              </div>
            ))}
            {!filtered.length && <div style={{ padding:'14px', fontSize:12, color:'#bbb' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const GlobeIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;
const XIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.745-8.867L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const LinkedInIcon=() => <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const GitHubIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;

const IconBox = ({ children }) => (
  <span style={{ width:44, minWidth:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', borderRight:'1px solid #f0f0f0', flexShrink:0 }}>
    {children}
  </span>
);

/* ────────────────────────────────────────────────────────
   INLINE SUBMIT PRODUCT FORM  (Settings-only, all-in-one)
   ──────────────────────────────────────────────────────── */
const SF_COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];
const SF_INDUSTRIES = ['Fintech','Edtech','Healthtech','E-Commerce','Logistics','AI & ML','Proptech','Cleantech','SaaS','Web3','Media','HR & Work','Foodtech','Traveltech','Other'];

const SI = { display:'block', width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff', color:'#0a0a0a' };
const SL = { display:'block', fontSize:11, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 };

function SectionHead({ icon, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 0 12px', borderBottom:'2px solid #f4f4f4', marginBottom:20 }}>
      <div style={{ width:32, height:32, borderRadius:10, background:'var(--orange-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'.07em', color:'#0a0a0a' }}>{title}</div>
    </div>
  );
}

function AvatarCircleS({ u, size=30 }) {
  const colors = ['#FF6B35','#E63946','#457B9D','#2A9D8F','#E9C46A','#7B2D8B'];
  const bg = u.avatar_color || colors[(u.handle||'').charCodeAt(0) % colors.length] || '#FF6B35';
  const initials = (u.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if (u.avatar_url) return <img src={u.avatar_url} style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover' }} alt={u.name}/>;
  return <div style={{ width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:800,color:'#fff',flexShrink:0 }}>{initials}</div>;
}

function SubmitProductForm({ user, onSuccess, onCancel, initialDraft }) {
  const [productType,   setProductType]   = useState(initialDraft?.type || null);
  const [form, setForm] = useState(initialDraft?.form || { name:'', tagline:'', website:'', industry:'', description:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
  const [logoFile,      setLogoFile]      = useState(null);
  const [countries,     setCountries]     = useState(initialDraft?.selectedCountries || []);
  const [screenshots,   setScreenshots]   = useState([null,null,null,null]);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);

  const [allEntities,   setAllEntities]   = useState([]);
  const [entityQ,       setEntityQ]       = useState(initialDraft?.selectedEntity?.name || '');
  const [entityResults, setEntityResults] = useState([]);
  const [entityOpen,    setEntityOpen]    = useState(false);
  const [selectedEntity,setSelectedEntity]= useState(initialDraft?.selectedEntity || null);

  const [founderQ,      setFounderQ]      = useState('');
  const [founderResults,setFounderResults]= useState([]);
  const [founderOpen,   setFounderOpen]   = useState(false);
  const [coFounders,    setCoFounders]    = useState(initialDraft?.coFounders || []);

  const logoRef = useRef(null);
  const ssRefs  = [useRef(null),useRef(null),useRef(null),useRef(null)];

  useEffect(() => {
    entitiesAPI.list({ limit:50 }).then(r => setAllEntities(r.data?.data || r.data || [])).catch(()=>{});
  }, []);

  const fo = e => e.target.style.borderColor = 'var(--orange)';
  const bl = e => e.target.style.borderColor = '#e8e8e8';
  const toggleCountry = code => setCountries(p => p.includes(code) ? p.filter(c=>c!==code) : [...p, code]);

  const handleLogo = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setLogoFile(ev.target.result); r.readAsDataURL(f);
  };
  const handleSS = (i, e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setScreenshots(p => { const n=[...p]; n[i]=ev.target.result; return n; }); r.readAsDataURL(f);
  };
  const removeSS = (i, e) => { e.stopPropagation(); setScreenshots(p => { const n=[...p]; n[i]=null; return n; }); };

  const searchEntity = q => {
    setEntityQ(q);
    const lower = q.toLowerCase();
    setEntityResults(q.trim() ? allEntities.filter(e=>(e.name||'').toLowerCase().includes(lower)) : allEntities);
  };
  const searchFounder = async q => {
    setFounderQ(q);
    if (!q.trim()) { setFounderResults([]); return; }
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(q)}&limit=6`);
      setFounderResults((res.data?.data||[]).filter(u => u.id !== user?.id && !coFounders.find(c=>c.id===u.id)));
    } catch { setFounderResults([]); }
  };

  const validate = () => {
    if (!productType) { toast.error('Select product type'); return false; }
    if (!form.name.trim()) { toast.error('Product name is required'); return false; }
    if (!form.tagline.trim()) { toast.error('Tagline is required'); return false; }
    if (!form.industry) { toast.error('Select an industry'); return false; }
    if (countries.length === 0) { toast.error('Select at least one country'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await productsAPI.create({
        name: form.name.trim(), tagline: form.tagline.trim(), industry: form.industry,
        description: form.description.trim() || null, website: form.website.trim() || null,
        logo_emoji: form.logoEmoji || '🚀', video_url: form.videoUrl.trim() || null,
        countries: countries.length > 0 ? countries : ['other'], tags: [],
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setSubmitted(true);
      onSuccess && onSuccess(form.name);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:48, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>You're all set!</div>
        <div style={{ fontSize:15, color:'#555', marginBottom:12 }}>
          <strong>{form.name}</strong> has been submitted for review.
        </div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#fff9f7', border:'1.5px solid #ffd6c2', borderRadius:12, fontSize:14, color:'#c0600a', fontWeight:600, marginBottom:28 }}>
          ⏱ Under review — usually approved within 24 hours
        </div>
        <div><button onClick={onCancel} style={{ padding:'11px 28px', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Back to My Products</button></div>
      </div>
    );
  }

  const ssCount = screenshots.filter(Boolean).length;
  const entityList = entityQ.trim() ? entityResults : allEntities;

  return (
    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, overflow:'hidden' }}>
      {/* Header bar */}
      <div style={{ padding:'20px 28px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={onCancel} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fafafa', fontSize:13, fontWeight:700, cursor:'pointer', color:'#555', flexShrink:0 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.01em' }}>Submit a Product</div>
          <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>Fill in the details below and submit — everything in one place.</div>
        </div>
      </div>

      {/* Form body */}
      <div style={{ padding:'28px 28px 36px' }}>

        {/* ── 1. Type ── */}
        <SectionHead icon="🚀" title="Launch Type"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:32 }}>
          {[['live','🚀','It\'s Live','Launched and ready to discover.'],
            ['soon','⏳','Coming Soon','Still building — collect a waitlist.']].map(([v,icon,label,desc]) => (
            <div key={v} onClick={() => setProductType(v)}
              style={{ border:`2px solid ${productType===v?'var(--orange)':'#e8e8e8'}`, borderRadius:14, padding:'18px 14px', cursor:'pointer', textAlign:'center', background:productType===v?'var(--orange-light)':'#fafafa', transition:'all .15s' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:12, color:'#888', lineHeight:1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* ── 2. Identity ── */}
        <SectionHead icon="🏷️" title="Product Identity"/>
        {/* Logo + name row */}
        <div style={{ display:'flex', gap:20, marginBottom:20, alignItems:'flex-start' }}>
          <div style={{ flexShrink:0 }}>
            <label style={SL}>Logo</label>
            <div onClick={() => logoRef.current?.click()} style={{ position:'relative', width:80, height:80, borderRadius:20, overflow:'hidden', cursor:'pointer', background:'#f4f4f4', border:'1.5px solid #e8e8e8' }}>
              {logoFile
                ? <img src={logoFile} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="logo"/>
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36 }}>{form.logoEmoji||'🚀'}</div>
              }
              <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity .15s' }}
                onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                <span style={{ fontSize:20 }}>📷</span>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogo}/>
            {logoFile && <button onClick={()=>setLogoFile(null)} style={{ marginTop:6, fontSize:11, color:'#bbb', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline', display:'block' }}>Remove</button>}
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={SL}>Product Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={SI} onFocus={fo} onBlur={bl}/>
            </div>
            <div>
              <label style={SL}>Tagline *</label>
              <input value={form.tagline} onChange={e=>setForm(f=>({...f,tagline:e.target.value}))} style={SI} onFocus={fo} onBlur={bl}/>
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <label style={SL}>Website URL</label>
            <input type="url" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} style={SI} onFocus={fo} onBlur={bl}/>
          </div>
          <div>
            <label style={SL}>Industry *</label>
            <select value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} style={{ ...SI, cursor:'pointer' }} onFocus={fo} onBlur={bl}>
              <option value="">Select…</option>
              {SF_INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:32 }}>
          <label style={SL}>Description * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#bbb' }}>3 sentences max</span></label>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
            placeholder="What it does, who it's for, why it's different…"
            style={{ ...SI, resize:'vertical', lineHeight:1.6 }} onFocus={fo} onBlur={bl}/>
        </div>

        {/* ── 3. Markets ── */}
        <SectionHead icon="🌍" title="Markets"/>
        <div style={{ marginBottom:32 }}>
          <label style={SL}>Available In * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#bbb' }}>Select all that apply</span></label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, padding:12, border:'1.5px solid #e8e8e8', borderRadius:12, background:'#fafafa', minHeight:52 }}>
            {SF_COUNTRIES.map(([v,flag,name]) => (
              <span key={v} onClick={()=>toggleCountry(v)}
                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', userSelect:'none', transition:'all .12s', background:countries.includes(v)?'var(--orange)':'#f0f0f0', color:countries.includes(v)?'#fff':'#444' }}>
                {flag} {name}
              </span>
            ))}
          </div>
        </div>

        {/* ── 4. Media ── */}
        <SectionHead icon="🖼️" title="Media"/>
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'9px 14px', borderRadius:11, background: ssCount===4?'#f0fdf4':'#fafafa', border:`1px solid ${ssCount===4?'#bbf7d0':'#e8e8e8'}` }}>
            <div style={{ display:'flex', gap:5 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width:24, height:5, borderRadius:99, background:screenshots[i]?'var(--orange)':'#e0e0e0', transition:'background .2s' }}/>)}
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:ssCount===4?'#16a34a':'#aaa' }}>
              {ssCount===4 ? '✅ All 4 uploaded' : `${ssCount} / 4 photos`}
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[0,1,2,3].map(i => (
              <div key={i}>
                <input ref={ssRefs[i]} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleSS(i,e)}/>
                <div onClick={()=>ssRefs[i].current?.click()}
                  style={{ aspectRatio:'4/3', borderRadius:12, border:`1.5px dashed ${screenshots[i]?'transparent':'#ddd'}`, background:screenshots[i]?'transparent':'#f8f8f8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative', transition:'border-color .15s' }}
                  onMouseEnter={e=>{ if(!screenshots[i]) e.currentTarget.style.borderColor='var(--orange)'; }}
                  onMouseLeave={e=>{ if(!screenshots[i]) e.currentTarget.style.borderColor='#ddd'; }}>
                  {screenshots[i] ? (
                    <>
                      <img src={screenshots[i]} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt={`ss${i+1}`}/>
                      <button type="button" onClick={e=>removeSS(i,e)} style={{ position:'absolute',top:4,right:4,width:20,height:20,borderRadius:5,background:'rgba(0,0,0,.5)',border:'none',color:'#fff',fontSize:11,cursor:'pointer',display:'grid',placeItems:'center' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom:4 }}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{ fontSize:9, color:'#ccc', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Photo {i+1}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ flex:1, height:1, background:'#e8e8e8' }}/><span style={{ fontSize:11, fontWeight:700, color:'#bbb', letterSpacing:'.06em' }}>OR ADD A VIDEO</span><div style={{ flex:1, height:1, background:'#e8e8e8' }}/>
          </div>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
            <input type="url" value={form.videoUrl} placeholder="https://youtube.com/watch?v=…" onChange={e=>setForm(f=>({...f,videoUrl:e.target.value}))} style={{ ...SI, paddingLeft:34 }} onFocus={fo} onBlur={bl}/>
          </div>
        </div>

        {/* ── 5. Entity ── */}
        <div style={{ marginBottom:32 }}>
          <SectionHead icon="🏢" title="Associated Entity"/>
          {selectedEntity ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', border:'1.5px solid var(--orange)', borderRadius:11, background:'var(--orange-light)' }}>
              <span style={{ fontSize:22 }}>{selectedEntity.logo_emoji||'🏢'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{selectedEntity.name}</div>
                <div style={{ fontSize:12, color:'#888', textTransform:'capitalize' }}>{(selectedEntity.type||selectedEntity.entity_type||'Company').replace('_',' ')}</div>
              </div>
              <button onClick={()=>{ setSelectedEntity(null); setEntityQ(''); }} style={{ background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#aaa',padding:4 }}>✕</button>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={entityQ} onChange={e=>{searchEntity(e.target.value);setEntityOpen(true);}}
                placeholder={`Search ${allEntities.length} registered companies…`}
                style={{ ...SI, paddingLeft:34 }}
                onFocus={()=>{setEntityOpen(true);if(!entityQ.trim())setEntityResults(allEntities);}}
                onBlur={()=>setTimeout(()=>setEntityOpen(false),180)}/>
              {entityOpen && entityList.length > 0 && (
                <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:200,background:'#fff',border:'1.5px solid #e8e8e8',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.12)',overflow:'hidden',maxHeight:200,overflowY:'auto' }}>
                  {entityList.map(e => (
                    <div key={e.id} onClick={()=>{setSelectedEntity(e);setEntityQ(e.name);setEntityOpen(false);}}
                      style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f4f4f4',transition:'background .1s' }}
                      onMouseEnter={ev=>ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev=>ev.currentTarget.style.background='#fff'}>
                      <span style={{ fontSize:20 }}>{e.logo_emoji||'🏢'}</span>
                      <div>
                        <div style={{ fontSize:13,fontWeight:700 }}>{e.name}</div>
                        <div style={{ fontSize:11,color:'#aaa',textTransform:'capitalize' }}>{(e.type||e.entity_type||'Company').replace('_',' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 6. Team ── */}
        <SectionHead icon="👥" title="Team & Visibility"/>
        {/* Profile toggle */}
        <div onClick={()=>setForm(f=>({...f,linkProfile:!f.linkProfile}))}
          style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',border:`1.5px solid ${form.linkProfile?'var(--orange)':'#e8e8e8'}`,borderRadius:14,background:form.linkProfile?'var(--orange-light)':'#fafafa',cursor:'pointer',transition:'all .15s',marginBottom:10 }}>
          <div style={{ width:44,height:24,borderRadius:99,background:form.linkProfile?'var(--orange)':'#ddd',position:'relative',flexShrink:0,transition:'background .2s' }}>
            <div style={{ position:'absolute',top:3,left:form.linkProfile?23:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,.2)',transition:'left .2s' }}/>
          </div>
          <div>
            <div style={{ fontSize:14,fontWeight:700 }}>Tag my profile with this post</div>
            <div style={{ fontSize:12,color:'#888',marginTop:2 }}>Your name will appear on the product card as the maker</div>
          </div>
        </div>
        {/* Co-founder search */}
        <div style={{ marginBottom:32 }}>
          <label style={{ ...SL, marginTop:16 }}>Tag co-founders / collaborators <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#bbb' }}>Optional</span></label>
          {coFounders.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {coFounders.map(cf => (
                <div key={cf.id} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 10px 5px 6px', border:'1.5px solid var(--orange)', borderRadius:20, background:'var(--orange-light)' }}>
                  <AvatarCircleS u={cf} size={22}/>
                  <span style={{ fontSize:13, fontWeight:700 }}>{cf.name}</span>
                  <button onClick={()=>setCoFounders(p=>p.filter(c=>c.id!==cf.id))} style={{ background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:14,padding:'0 0 0 2px',lineHeight:1 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={founderQ} onChange={e=>{searchFounder(e.target.value);setFounderOpen(true);}}
              placeholder="Search by name or @handle…" style={{ ...SI, paddingLeft:34 }}
              onFocus={()=>setFounderOpen(true)} onBlur={()=>setTimeout(()=>setFounderOpen(false),180)}/>
            {founderOpen && founderResults.length > 0 && (
              <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:200,background:'#fff',border:'1.5px solid #e8e8e8',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.12)',overflow:'hidden' }}>
                {founderResults.map(u => (
                  <div key={u.id} onClick={()=>{ setCoFounders(p=>p.find(c=>c.id===u.id)?p:[...p,u]); setFounderQ(''); setFounderResults([]); setFounderOpen(false); }}
                    style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f4f4f4',transition:'background .1s' }}
                    onMouseEnter={ev=>ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev=>ev.currentTarget.style.background='#fff'}>
                    <AvatarCircleS u={u} size={34}/>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700 }}>{u.name}</div>
                      <div style={{ fontSize:11,color:'#aaa' }}>@{u.handle} · {u.persona||'Member'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Submit ── */}
        <div style={{ padding:'20px 24px', background:'#f8f8f8', borderRadius:14, border:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:13, color:'#888', lineHeight:1.5 }}>
            ⏱ <strong style={{ color:'#555' }}>Under review</strong> — usually approved within 24 hours after submission.
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ padding:'13px 32px', borderRadius:12, border:'none', background:submitting?'#e8e8e8':'var(--orange)', color:submitting?'#aaa':'#fff', fontSize:15, fontWeight:800, cursor:submitting?'not-allowed':'pointer', transition:'all .15s', flexShrink:0 }}>
            {submitting ? 'Submitting…' : '🚀 Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { setSubmitOpen } = useUI();
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState('profile');
  const [copied,       setCopied]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [showSubmitForm,setShowSubmitForm] = useState(false);
  const [submitDraft,   setSubmitDraft]   = useState(null);
  const [localDraft,    setLocalDraft]    = useState(() => {
    try { const d = localStorage.getItem(DRAFT_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
  });

  const [name,         setName]         = useState(user?.name      || '');
  const [handle,       setHandle]       = useState((user?.handle || '').replace('@',''));
  const [headline,     setHeadline]     = useState(user?.headline   || '');
  const [bio,          setBio]          = useState(user?.bio        || '');
  const [phone,        setPhone]        = useState(user?.phone      || '');
  const [dialCode,     setDialCode]     = useState(WORLD_DIALS.find(x=>x.c==='sa') || WORLD_DIALS[0]);
  const [countryVal,   setCountryVal]   = useState('');
  const [cityVal,      setCityVal]      = useState('');
  const [persona,      setPersona]      = useState(user?.persona    || 'Founder');
  const [website,      setWebsite]      = useState(user?.website    || '');
  const [twitter,      setTwitter]      = useState(user?.twitter    || '');
  const [linkedin,     setLinkedin]     = useState(user?.linkedin   || '');
  const [github,       setGithub]       = useState(user?.github     || '');
  const [activeThread,  setActiveThread]  = useState(null);
  const [msgInput,      setMsgInput]      = useState('');
  const [threads,       setThreads]       = useState([]);
  const [settingsMsgs,  setSettingsMsgs]  = useState([]);
  const [settingsSending, setSettingsSending] = useState(false);
  const settingsMsgScrollRef = React.useRef(null);

  const fileInputRef = useRef(null);
  const cropImgRef   = useRef(null);
  const [avatarImg, setAvatarImg] = useState(() => {
    try { return user?.avatar_url || localStorage.getItem(`tlm_avatar_${user?.id}`) || null; } catch { return user?.avatar_url || null; }
  });
  const [cropSrc,       setCropSrc]       = useState(null);
  const [crop,          setCrop]          = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [cropSaving,    setCropSaving]    = useState(false);

  const [coType,     setCoType]    = useState('');
  const [coName,     setCoName]    = useState('');
  const [coLogoImg,  setCoLogoImg] = useState(null);
  const [coIndustry, setCoIndustry]= useState('');
  const [coCountry,  setCoCountry] = useState([]);
  const [coCountryOpen, setCoCountryOpen] = useState(false);
  const [coStages,   setCoStages]  = useState([]);
  const [coAbout,    setCoAbout]   = useState('');
  const [coWebsite,  setCoWebsite] = useState('');
  const [coLinkedIn, setCoLinkedIn]= useState('');
  const [coTwitter,  setCoTwitter] = useState('');
  const [coTikTok,   setCoTikTok]  = useState('');
  const [coInstagram,setCoInstagram]=useState('');
  const [coTeam,     setCoTeam]    = useState('');
  const [coFounded,  setCoFounded] = useState('');
  const [coStageOpen,setCoStageOpen]=useState(false);
  const [coSubmitted,setCoSubmitted]=useState(false);
  const [coSaving,   setCoSaving]  = useState(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      setCrop(undefined);
      setCompletedCrop(null);
    };
    reader.readAsDataURL(file);
  };

  const onCropImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const c = centerCrop(makeAspectCrop({ unit:'%', width:80 }, 1, w, h), w, h);
    setCrop(c);
  };

  const saveCroppedAvatar = async () => {
    if (!completedCrop || !cropImgRef.current) return;
    setCropSaving(true);
    try {
      const img    = cropImgRef.current;
      const scaleX = img.naturalWidth  / img.width;
      const scaleY = img.naturalHeight / img.height;
      const canvas = document.createElement('canvas');
      const size   = 400;
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        img,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width  * scaleX,
        completedCrop.height * scaleY,
        0, 0, size, size
      );
      const base64 = canvas.toDataURL('image/jpeg', 0.88);
      setAvatarImg(base64);
      setCropSrc(null);
      try { localStorage.setItem(`tlm_avatar_${user.id}`, base64); } catch {}
      const res = await api.put('/users/me', { avatar_url: base64 });
      if (res.data?.success) {
        updateUser({ avatar_url: base64 });
        toast.success('Profile photo updated!');
      }
    } catch {
      toast.error('Failed to save photo. Please try again.');
    } finally { setCropSaving(false); }
  };

  const handleCoLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setCoLogoImg(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const toggleCoStage   = (s) => setCoStages  (prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);
  const toggleCoCountry = (v) => setCoCountry (prev => prev.includes(v) ? prev.filter(x=>x!==v) : [...prev, v]);

  const handleCoSubmit = async () => {
    if (!coType) { toast.error('Please select an entity type'); return; }
    if (!coName.trim()) { toast.error('Entity name is required'); return; }
    setCoSaving(true);
    try {
      const typeMap = {
        'Company': 'startup',
        'Accelerator/Incubator': 'accelerator',
        'Venture Studio': 'venture_studio',
        'Investment Firm': 'investor',
      };
      const countryLabel = coCountry.length > 0
        ? (MENA_COUNTRIES_LIST.find(c => c.v === coCountry[0])?.l?.replace(/^[\S]+ /,'') || coCountry[0])
        : null;
      await entitiesAPI.create({
        name: coName.trim(),
        type: typeMap[coType] || 'company',
        description: coAbout || null,
        website: coWebsite || null,
        country: countryLabel,
        industry: coIndustry || null,
        stage: coStages.length > 0 ? coStages.join(', ') : null,
        employees: coTeam || null,
        founded_year: coFounded ? parseInt(coFounded) : null,
        focus: null,
        logo_emoji: '🏢',
      });
      setCoSaving(false);
      setCoSubmitted(true);
      toast.success('Entity submitted for review!');
    } catch (err) {
      setCoSaving(false);
      toast.error(err?.response?.data?.message || 'Something went wrong, please try again.');
    }
  };

  if (!user) { navigate('/login'); return null; }

  const initials     = user.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const personaObj   = PERSONAS.find(p=>p.v===persona) || PERSONAS[0];
  const handleClean  = handle.replace('@','');

  const selectedCountry = WORLD_COUNTRIES.find(c=>c.v===countryVal);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`tlmena.com/${handleClean}`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r=>setTimeout(r,600));
      updateUser({ name, headline, bio, website, twitter, linkedin, github, persona, country:countryVal, city:cityVal });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleTabNav = (key) => {
    if (key === 'bookmarks') { navigate('/bookmarks'); return; }
    setActiveTab(key);
  };

  const loadSettingsThreads = React.useCallback(async () => {
    try {
      const res = await api.get('/messages/threads');
      if (res.data?.success) setThreads(res.data.data);
    } catch {}
  }, []);

  const loadSettingsMessages = React.useCallback(async (handle) => {
    if (!handle) return;
    try {
      const res = await api.get(`/messages/${handle}`);
      if (res.data?.success) setSettingsMsgs(res.data.data);
    } catch {}
  }, []);

  React.useEffect(() => {
    if (activeTab === 'messages') loadSettingsThreads();
  }, [activeTab, loadSettingsThreads]);

  React.useEffect(() => {
    if (activeThread) loadSettingsMessages(activeThread);
  }, [activeThread, loadSettingsMessages]);

  React.useEffect(() => {
    if (settingsMsgScrollRef.current) settingsMsgScrollRef.current.scrollTop = settingsMsgScrollRef.current.scrollHeight;
  }, [settingsMsgs]);

  const sendMsg = async () => {
    if (!msgInput.trim() || !activeThread || settingsSending) return;
    const text = msgInput.trim(); setMsgInput('');
    setSettingsSending(true);
    try {
      await api.post(`/messages/${activeThread}`, { body: text });
      await loadSettingsMessages(activeThread);
      await loadSettingsThreads();
    } catch { setMsgInput(text); } finally { setSettingsSending(false); }
  };

  const currentThread = threads.find(t => t.handle === activeThread);

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 32px 80px', display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* Sidebar nav */}
          <div style={{ width:190, flexShrink:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', position:'sticky', top:'calc(var(--nav-h) + 20px)' }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={()=>handleTabNav(item.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 16px', border:'none', borderBottom:'1px solid #f4f4f4', background:activeTab===item.key?'var(--orange-light)':'#fff', color:activeTab===item.key?'var(--orange)':'#444', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>
                <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* ── MY PROFILE ── */}
            {activeTab === 'profile' && (<>
              {/* Profile preview card */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, overflow:'hidden', marginBottom:20 }}>
                <div style={{ height:110, background:'linear-gradient(135deg,#0a0a0a 0%,#E15033 100%)', position:'relative' }}>
                  <button onClick={()=>navigate(`/u/${handleClean}`)}
                    style={{ position:'absolute', top:14, right:14, padding:'7px 14px', borderRadius:10, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Preview Profile
                  </button>
                </div>
                <div style={{ padding:'0 24px 24px', position:'relative' }}>
                  <div style={{ position:'relative', display:'inline-block', marginTop:-36, marginBottom:10 }}>
                    {avatarImg ? (
                      <img src={avatarImg} alt="avatar" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)', display:'block' }}/>
                    ) : (
                      <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color||'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:22, fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>{initials}</div>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'#fff', border:'2px solid #e8e8e8', display:'grid', placeItems:'center', cursor:'pointer' }} title="Upload photo">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarUpload}/>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, marginBottom:3 }}>{user.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'var(--orange)', fontWeight:600 }}>tlmena.com/{handleClean}</span>
                    <button onClick={handleCopy} style={{ padding:'2px 8px', borderRadius:6, background:'#f4f4f4', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, color:'#555', display:'flex', alignItems:'center', gap:4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {headline && <div style={{ fontSize:13, color:'#666', marginBottom:10 }}>{headline}</div>}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--orange-light)', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--orange)' }}>
                    {personaObj.icon} {personaObj.v.toLowerCase()}
                  </div>
                </div>
              </div>

              {/* ── Identity ── */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>🪪 Identity</div>

                {/* Row 1: Full Name + Handle */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={labelStyle}>FULL NAME</label>
                    <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex' }}
                      onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                      <input type="text" value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="Your full name"/>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>HANDLE</label>
                    <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex', alignItems:'center', overflow:'hidden' }}
                      onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                      <span style={{ padding:'10px 10px 10px 14px', fontSize:13, color:'#aaa', background:'#fafafa', borderRight:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>tlmena.com/</span>
                      <input type="text" value={handleClean} onChange={e=>setHandle(e.target.value.replace(/[^a-z0-9_]/gi,'').toLowerCase())} style={inputStyle} placeholder="yourhandle"/>
                    </div>
                  </div>
                </div>

                {/* Row 2: Phone + Email */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={labelStyle}>PHONE NUMBER</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <div style={{ flexShrink:0 }}>
                        <SearchDD value={dialCode?.c}
                          onChange={item => setDialCode(item)}
                          items={WORLD_DIALS}
                          matchFn={(item, q) => item.n.toLowerCase().includes(q.toLowerCase()) || item.d.includes(q)}
                          renderTrigger={() => dialCode ? `${dialCode.f} ${dialCode.d}` : '🌐'}
                          renderItem={item => `${item.f} ${item.d}  ${item.n}`}/>
                      </div>
                      <div style={{ flex:1, border:'1.5px solid #e8e8e8', borderRadius:10, display:'flex' }}>
                        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="5X XXX XXXX" style={inputStyle}/>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL</label>
                    <div style={{ border:'1.5px solid #f0f0f0', borderRadius:10, background:'#fafafa', display:'flex' }}>
                      <input type="email" value={user.email||''} disabled style={{ ...inputStyle, color:'#aaa', cursor:'not-allowed' }}/>
                    </div>
                  </div>
                </div>

                {/* Headline */}
                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>HEADLINE</label>
                  <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex' }}
                    onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                    <input type="text" value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="e.g. Founder @ Tabby · Fintech · UAE" style={inputStyle}/>
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>BIO</label>
                  <textarea value={bio} onChange={e=>setBio(e.target.value)}
                    placeholder="Passionate about connecting builders, investors and innovators across the Arab world. Always looking for the next big idea."
                    rows={4}
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }}
                    onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                </div>

                {/* Row: Persona + Country */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={labelStyle}>PERSONA</label>
                    <SearchDD value={persona}
                      onChange={item => setPersona(item.v)}
                      items={PERSONAS}
                      matchFn={(item, q) => item.v.toLowerCase().includes(q.toLowerCase())}
                      renderTrigger={(val) => {
                        const p = PERSONAS.find(x=>x.v===val);
                        return p ? `${p.icon} ${p.v}` : 'Select persona…';
                      }}
                      renderItem={item => `${item.icon} ${item.v}`}/>
                  </div>
                  <div>
                    <label style={labelStyle}>COUNTRY</label>
                    <SearchDD value={countryVal}
                      onChange={item => setCountryVal(item.v)}
                      items={WORLD_COUNTRIES}
                      matchFn={(item, q) => item.l.toLowerCase().includes(q.toLowerCase())}
                      renderTrigger={(val) => {
                        const c = WORLD_COUNTRIES.find(x=>x.v===val);
                        return c ? c.l : 'Select country…';
                      }}
                      renderItem={item => item.l}/>
                  </div>
                </div>

                {/* City plain text */}
                <div>
                  <label style={labelStyle}>CITY</label>
                  <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex' }}
                    onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                    <input type="text" value={cityVal} onChange={e=>setCityVal(e.target.value)} placeholder="e.g. Dubai, Cairo, Riyadh…" style={inputStyle}
                      onFocus={e=>e.currentTarget.parentElement.style.borderColor='var(--orange)'}
                      onBlur={e=>e.currentTarget.parentElement.style.borderColor='#e8e8e8'}/>
                  </div>
                </div>
              </div>

              {/* ── Links ── */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>🔗 Links</div>
                <div style={{ display:'grid', gap:14 }}>
                  {[
                    { label:'WEBSITE',    value:website,  setter:setWebsite,  placeholder:'https://yoursite.com', Icon:GlobeIcon },
                    { label:'TWITTER / X',value:twitter,  setter:setTwitter,  placeholder:'@handle',              Icon:XIcon },
                    { label:'LINKEDIN',   value:linkedin, setter:setLinkedin, placeholder:'linkedin.com/in/handle',Icon:LinkedInIcon },
                    { label:'GITHUB',     value:github,   setter:setGithub,   placeholder:'github.com/username',  Icon:GitHubIcon },
                  ].map(field => (
                    <div key={field.label}>
                      <label style={labelStyle}>{field.label}</label>
                      <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, display:'flex', alignItems:'center', overflow:'hidden' }}
                        onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'}
                        onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'}
                        tabIndex={-1}>
                        <IconBox><field.Icon/></IconBox>
                        <input type="text" value={field.value} onChange={e=>field.setter(e.target.value)} placeholder={field.placeholder}
                          style={inputStyle} onFocus={e=>e.currentTarget.parentElement.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.parentElement.style.borderColor='#e8e8e8'}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
                <button onClick={()=>navigate(`/u/${handleClean}`)} style={{ padding:'11px 22px', borderRadius:12, background:'#fff', border:'1.5px solid #e8e8e8', color:'#555', fontSize:14, fontWeight:700, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding:'11px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>)}

            {/* ── MY PRODUCTS ── */}
            {activeTab === 'products' && (
              <div>
                {showSubmitForm ? (
                  <SubmitProductForm
                    user={user}
                    initialDraft={submitDraft}
                    onSuccess={(name) => {
                      toast.success(`${name} submitted!`);
                      setLocalDraft(null);
                    }}
                    onCancel={() => { setShowSubmitForm(false); setSubmitDraft(null); }}
                  />
                ) : (
                  <>
                    {/* Draft card */}
                    {localDraft && localDraft.form?.name && (
                      <div style={{ background:'#fff9f7', border:'1.5px solid #ffd6c2', borderRadius:16, padding:20, marginBottom:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                          <div style={{ width:48, height:48, borderRadius:14, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                            {localDraft.form.logoEmoji || '🚀'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                              <div style={{ fontSize:15, fontWeight:800 }}>{localDraft.form.name}</div>
                              <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#ffd6c2', color:'#c0600a' }}>DRAFT</span>
                            </div>
                            <div style={{ fontSize:12, color:'#888' }}>{localDraft.form.tagline || 'No tagline yet'}</div>
                            {localDraft.savedAt && <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>Saved {new Date(localDraft.savedAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</div>}
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => { setSubmitDraft(localDraft); setShowSubmitForm(true); }}
                            style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', background:'var(--orange)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            Continue Draft →
                          </button>
                          <button onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setLocalDraft(null); toast.success('Draft deleted'); }}
                            style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', color:'#e63946', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'48px 40px', textAlign:'center' }}>
                      <div style={{ fontSize:48, marginBottom:14 }}>🚀</div>
                      <div style={{ fontSize:19, fontWeight:800, marginBottom:8 }}>No products yet</div>
                      <p style={{ color:'#888', marginBottom:24, lineHeight:1.6 }}>Ready to launch? Submit your product and get discovered by the MENA tech community.</p>
                      <button onClick={() => { setSubmitDraft(null); setShowSubmitForm(true); }}
                        style={{ padding:'13px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:15, fontWeight:800, cursor:'pointer' }}>
                        Submit a Product 🚀
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── APPLIED ── */}
            {activeTab === 'applied' && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No applications yet</div>
                <p style={{ color:'#888' }}>Programs and opportunities you apply to will appear here.</p>
              </div>
            )}

            {/* ── MESSAGES ── */}
            {activeTab === 'messages' && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>💬 Messages</div>
                <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Your conversations.</div>
                <div className="adm-msg-wrap">
                  <div className="adm-threads">
                    <div className="adm-threads-hd">Conversations</div>
                    {threads.length === 0
                      ? <div style={{ padding:'24px 16px', fontSize:13, color:'#ccc' }}>No conversations yet.<br/>Visit someone's profile and hit Message.</div>
                      : threads.map(t => {
                          const initials = (t.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
                          return (
                            <div key={t.handle} className={`adm-thread${activeThread===t.handle?' sel':''}`} onClick={()=>setActiveThread(t.handle)}>
                              {t.avatar_url
                                ? <img src={t.avatar_url} alt={t.name} style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0 }}/>
                                : <div className="adm-thread-av" style={{ background:t.avatar_color||'var(--orange)' }}>{initials}</div>}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div className="adm-thread-name" style={{ display:'flex', alignItems:'center', gap:4 }}>
                                  {t.name}
                                  {t.unread_count > 0 && <span style={{ width:16,height:16,borderRadius:'50%',background:'var(--orange)',color:'#fff',fontSize:9,fontWeight:900,display:'inline-grid',placeItems:'center' }}>{t.unread_count}</span>}
                                </div>
                                <div className="adm-thread-prev">{t.last_sender_id===user?.id?'You: ':''}{t.last_message||''}</div>
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                  <div className="adm-chat-area">
                    {!activeThread ? (
                      <div className="adm-chat-empty">
                        <div><div style={{ fontSize:40, marginBottom:12 }}>💬</div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#ccc' }}>Select a conversation</div>
                        </div>
                      </div>
                    ) : (<>
                      <div className="adm-chat-hd">{currentThread?.name || activeThread}</div>
                      <div className="adm-bubbles" ref={settingsMsgScrollRef}>
                        {settingsMsgs.length === 0
                          ? <div style={{ textAlign:'center', color:'#ccc', fontSize:12, margin:'auto' }}>No messages yet. Say hello! 👋</div>
                          : settingsMsgs.map(m => {
                              const isMe = m.sender_id === user?.id;
                              const time = new Date(m.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
                              return (
                                <div key={m.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', marginBottom:6 }}>
                                  <div className={`adm-bubble ${isMe?'mine':'theirs'}`}>
                                    {m.body}
                                    <div style={{ fontSize:10, opacity:.5, marginTop:3, textAlign:'right' }}>{time}</div>
                                  </div>
                                </div>
                              );
                            })
                        }
                      </div>
                      <div className="adm-composer">
                        <input className="adm-compose-input" value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                          placeholder="Type a message…" onKeyDown={e=>e.key==='Enter'&&sendMsg()} disabled={settingsSending}/>
                        <button className="adm-compose-send" onClick={sendMsg} disabled={settingsSending}>↑</button>
                      </div>
                    </>)}
                  </div>
                </div>
              </div>
            )}

            {/* ── CREATE ENTITY PAGE ── */}
            {activeTab === 'company' && (() => {
              const inpStyle = { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' };
              const selStyle = { ...inpStyle, background:'#fff', cursor:'pointer' };
              const fo = e => { e.target.style.borderColor='var(--orange)'; };
              const bl = e => { e.target.style.borderColor='#e8e8e8'; };
              const yearOpts = Array.from({length:2026-1990+1},(_,i)=>2026-i);
              const ENTITY_TYPES = ['Company','Accelerator/Incubator','Venture Studio','Investment Firm'];
              const isInvFirm = coType === 'Investment Firm';
              const isCompany = coType === 'Company';

              const resetForm = () => {
                setCoType(''); setCoName(''); setCoLogoImg(null); setCoIndustry(''); setCoCountry([]);
                setCoStages([]); setCoAbout(''); setCoWebsite(''); setCoLinkedIn(''); setCoTwitter('');
                setCoTikTok(''); setCoInstagram(''); setCoTeam(''); setCoFounded(''); setCoSubmitted(false);
              };

              const previewLinks = [
                coWebsite   && { icon:'🌐', label:'Website',   url: coWebsite },
                coLinkedIn  && { icon:'💼', label:'LinkedIn',  url: coLinkedIn },
                coTwitter   && { icon:'𝕏',  label:'Twitter',   url: coTwitter },
                coTikTok    && { icon:'♪',  label:'TikTok',    url: coTikTok },
                coInstagram && { icon:'📸', label:'Instagram', url: coInstagram },
              ].filter(Boolean);

              return (
                <div>
                  <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>Create Entity Page</div>
                  <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>List your company or organization on Tech Launch MENA's directory.</div>

                  {coSubmitted ? (
                    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'52px 32px', textAlign:'center' }}>
                      <div style={{ width:72, height:72, borderRadius:'50%', background:'#f0fdf4', display:'grid', placeItems:'center', fontSize:36, margin:'0 auto 20px' }}>✅</div>
                      <div style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Your entity is under review</div>
                      <p style={{ color:'#666', fontSize:14, lineHeight:1.7, maxWidth:420, margin:'0 auto 20px' }}>
                        <strong>{coName}</strong> has been submitted. Our team will review and publish your entity page within 48 hours. You'll be notified once it goes live.
                      </p>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#f0fdf4', padding:'8px 20px', borderRadius:20, fontSize:13, fontWeight:700, color:'#16a34a', marginBottom:28 }}>
                        Under review · Estimated 48 hours
                      </div>
                      <br/>
                      <button onClick={resetForm}
                        style={{ padding:'10px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                        Submit Another Entity
                      </button>
                    </div>
                  ) : (<>

                    {/* ── Preview card ── */}
                    {coName && (
                      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:16 }}>
                        <div style={{ width:56, height:56, borderRadius:14, background:'#f5f5f5', border:'1px solid #eee', display:'grid', placeItems:'center', fontSize:28, flexShrink:0, overflow:'hidden' }}>
                          {coLogoImg
                            ? <img src={coLogoImg} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : <span style={{ fontSize:22, color:'#bbb' }}>?</span>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:16, fontWeight:800, color:'#0a0a0a' }}>{coName}</div>
                          <div style={{ fontSize:12, color:'#aaa', margin:'3px 0 6px', display:'flex', gap:5, flexWrap:'wrap' }}>
                            {coType && <span>{coType}</span>}
                            {coType && coCountry.length>0 && <span>·</span>}
                            {coCountry.length>0 && <span>{coCountry.map(v=>MENA_COUNTRIES_LIST.find(c=>c.v===v)?.l).filter(Boolean).join(', ')}</span>}
                            {coCountry.length>0 && coIndustry && <span>·</span>}
                            {coIndustry && <span>{coIndustry}</span>}
                            {isInvFirm && coStages.length > 0 && <><span>·</span><span>{coStages.join(', ')}</span></>}
                            {isCompany && coTeam && <><span>·</span><span>{coTeam} people</span></>}
                            {coFounded && <><span>·</span><span>Est. {coFounded}</span></>}
                          </div>
                          {coAbout && <div style={{ fontSize:13, color:'#555', lineHeight:1.6, marginBottom:previewLinks.length?8:0 }}>{coAbout}</div>}
                          {previewLinks.length > 0 && (
                            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                              {previewLinks.map(lk => (
                                <a key={lk.label} href={lk.url} target="_blank" rel="noreferrer"
                                  style={{ fontSize:12, color:'var(--orange)', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                                  {lk.icon} {lk.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Form ── */}
                    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
                      <div style={{ fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>Entity Details</div>

                      {/* Entity type */}
                      <div style={{ marginBottom:16 }}>
                        <label style={labelStyle}>ENTITY TYPE *</label>
                        <select value={coType} onChange={e=>setCoType(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                          <option value="">Select entity type</option>
                          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      {/* Logo upload */}
                      <div style={{ marginBottom:16 }}>
                        <label style={labelStyle}>COMPANY LOGO</label>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:52, height:52, borderRadius:14, background:'#f5f5f5', border:'1.5px solid #e8e8e8', display:'grid', placeItems:'center', overflow:'hidden', flexShrink:0 }}>
                            {coLogoImg
                              ? <img src={coLogoImg} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                              : <span style={{ fontSize:22, color:'#ccc' }}>?</span>}
                          </div>
                          <label style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:13, fontWeight:600, color:'#333', cursor:'pointer', background:'#fafafa', whiteSpace:'nowrap' }}>
                            Upload company logo
                            <input type="file" accept="image/*" onChange={handleCoLogoUpload} style={{ display:'none' }}/>
                          </label>
                          <span style={{ fontSize:12, color:'#bbb' }}>PNG, JPG up to 2MB</span>
                        </div>
                      </div>

                      {/* Entity name */}
                      <div style={{ marginBottom:16 }}>
                        <label style={labelStyle}>ENTITY NAME *</label>
                        <input value={coName} onChange={e=>setCoName(e.target.value)} placeholder="e.g. Tabby" style={inpStyle} onFocus={fo} onBlur={bl}/>
                      </div>

                      {/* Industry + Country */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                        <div>
                          <label style={labelStyle}>INDUSTRY</label>
                          <select value={coIndustry} onChange={e=>setCoIndustry(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                            <option value="">Select industry</option>
                            {MENA_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </div>
                        <div style={{ position:'relative' }}>
                          <label style={labelStyle}>COUNTRY (select all that apply)</label>
                          <div onClick={()=>setCoCountryOpen(o=>!o)}
                            style={{ ...inpStyle, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none', color: coCountry.length ? '#0a0a0a' : '#aaa' }}>
                            {coCountry.length
                              ? coCountry.map(v=>MENA_COUNTRIES_LIST.find(c=>c.v===v)?.l).filter(Boolean).join(', ')
                              : 'Select countries…'}
                            <span style={{ fontSize:10, color:'#aaa', flexShrink:0, marginLeft:6 }}>▼</span>
                          </div>
                          {coCountryOpen && (
                            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, zIndex:50, marginTop:4, maxHeight:220, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,.08)' }}>
                              {MENA_COUNTRIES_LIST.map(c => (
                                <label key={c.v} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 16px', cursor:'pointer', fontSize:14, fontFamily:'Inter,sans-serif' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                  <input type="checkbox" checked={coCountry.includes(c.v)} onChange={()=>toggleCoCountry(c.v)}
                                    style={{ accentColor:'var(--orange)', width:16, height:16, cursor:'pointer' }}/>
                                  {c.l}
                                </label>
                              ))}
                              <div style={{ padding:'8px 16px', borderTop:'1px solid #f0f0f0' }}>
                                <button onClick={()=>setCoCountryOpen(false)}
                                  style={{ fontSize:12, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stage focus — Investment Firm only, multi-select */}
                      {isInvFirm && (
                        <div style={{ marginBottom:16, position:'relative' }}>
                          <label style={labelStyle}>STAGE FOCUS (select all that apply)</label>
                          <div onClick={()=>setCoStageOpen(o=>!o)}
                            style={{ ...inpStyle, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none', color: coStages.length ? '#0a0a0a' : '#aaa' }}>
                            {coStages.length ? coStages.join(', ') : 'Select stages…'}
                            <span style={{ fontSize:10, color:'#aaa' }}>▼</span>
                          </div>
                          {coStageOpen && (
                            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, zIndex:50, marginTop:4, padding:'8px 0', boxShadow:'0 8px 24px rgba(0,0,0,.08)' }}>
                              {FUNDING_STAGES.map(s => (
                                <label key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', cursor:'pointer', fontSize:14, fontFamily:'Inter,sans-serif' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                  <input type="checkbox" checked={coStages.includes(s)} onChange={()=>toggleCoStage(s)}
                                    style={{ accentColor:'var(--orange)', width:16, height:16, cursor:'pointer' }}/>
                                  {s}
                                </label>
                              ))}
                              <div style={{ padding:'8px 16px', borderTop:'1px solid #f0f0f0', marginTop:4 }}>
                                <button onClick={()=>setCoStageOpen(false)}
                                  style={{ fontSize:12, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Team size — Company only */}
                      {isCompany && (
                        <div style={{ marginBottom:16 }}>
                          <label style={labelStyle}>TEAM SIZE</label>
                          <select value={coTeam} onChange={e=>setCoTeam(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                            <option value="">Select size</option>
                            {['1–5','6–15','16–30','31–60','61–100','100–250','250+'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Founded year — dropdown */}
                      <div style={{ marginBottom:16 }}>
                        <label style={labelStyle}>FOUNDED YEAR</label>
                        <select value={coFounded} onChange={e=>setCoFounded(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                          <option value="">Select year</option>
                          {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>

                      {/* About */}
                      <div style={{ marginBottom:20 }}>
                        <label style={labelStyle}>ABOUT</label>
                        <textarea value={coAbout} onChange={e=>setCoAbout(e.target.value)} rows={4}
                          placeholder="Describe what your entity does, who it serves, and what makes it unique in the MENA market..."
                          style={{ ...inpStyle, resize:'vertical', lineHeight:1.6 }}
                          onFocus={fo} onBlur={bl}/>
                      </div>

                      {/* Social links */}
                      <div style={{ marginBottom:20 }}>
                        <label style={labelStyle}>SOCIAL & WEB LINKS</label>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          {[
                            { icon:'🌐', label:'Website',   val:coWebsite,    set:setCoWebsite,   ph:'https://yourcompany.com' },
                            { icon:'💼', label:'LinkedIn',  val:coLinkedIn,   set:setCoLinkedIn,  ph:'https://linkedin.com/company/...' },
                            { icon:'𝕏',  label:'Twitter',   val:coTwitter,    set:setCoTwitter,   ph:'https://twitter.com/...' },
                            { icon:'♪',  label:'TikTok',    val:coTikTok,     set:setCoTikTok,    ph:'https://tiktok.com/@...' },
                            { icon:'📸', label:'Instagram', val:coInstagram,  set:setCoInstagram, ph:'https://instagram.com/...' },
                          ].map(lk => (
                            <div key={lk.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:36, height:36, borderRadius:10, background:'#f5f5f5', display:'grid', placeItems:'center', fontSize:16, flexShrink:0 }}>{lk.icon}</div>
                              <input value={lk.val} onChange={e=>lk.set(e.target.value)} placeholder={lk.ph}
                                style={{ ...inpStyle, flex:1 }} onFocus={fo} onBlur={bl}/>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleCoSubmit} disabled={coSaving || !coName.trim() || !coType}
                        style={{ padding:'12px 28px', borderRadius:12, background:(coName.trim()&&coType)?'var(--orange)':'#e8e8e8', color:(coName.trim()&&coType)?'#fff':'#aaa', border:'none', fontSize:14, fontWeight:700, cursor:(coName.trim()&&coType)?'pointer':'not-allowed', transition:'all .15s' }}>
                        {coSaving ? 'Submitting…' : 'Submit Entity for Review'}
                      </button>
                    </div>

                  </>)}
                </div>
              );
            })()}

          </div>
        </div>
      </div>
      <Footer/>

      {/* ── Avatar Crop Modal ── */}
      {cropSrc && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setCropSrc(null); }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.4)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800 }}>Crop your photo</div>
                <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>Drag and resize the circle to crop</div>
              </div>
              <button onClick={() => setCropSrc(null)}
                style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f4f4f4', cursor:'pointer', fontSize:16, display:'grid', placeItems:'center' }}>✕</button>
            </div>

            <div style={{ display:'flex', justifyContent:'center', maxHeight:400, overflow:'auto' }}>
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                style={{ maxWidth:'100%' }}>
                <img
                  ref={cropImgRef}
                  src={cropSrc}
                  onLoad={onCropImageLoad}
                  style={{ maxWidth:'100%', maxHeight:360, display:'block' }}
                  alt="crop preview"/>
              </ReactCrop>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setCropSrc(null)}
                style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', color:'#555' }}>
                Cancel
              </button>
              <button onClick={saveCroppedAvatar} disabled={!completedCrop || cropSaving}
                style={{ padding:'10px 24px', borderRadius:10, border:'none', background:completedCrop&&!cropSaving?'var(--orange)':'#ccc', color:'#fff', fontSize:13, fontWeight:700, cursor:completedCrop&&!cropSaving?'pointer':'not-allowed' }}>
                {cropSaving ? 'Saving…' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
