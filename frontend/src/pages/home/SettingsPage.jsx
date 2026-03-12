import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
  { key:'profile',   icon:'👤', label:'My Profile'  },
  { key:'products',  icon:'🚀', label:'My Products' },
  { key:'applied',   icon:'📋', label:'Applied'     },
  { key:'messages',  icon:'💬', label:'Messages'    },
  { key:'bookmarks', icon:'🔖', label:'Bookmarks'   },
];

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

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState('profile');
  const [copied,       setCopied]       = useState(false);
  const [saving,       setSaving]       = useState(false);

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
  const [activeThread, setActiveThread] = useState(null);
  const [msgInput,     setMsgInput]     = useState('');
  const [threads,      setThreads]      = useState([]);

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

  const sendMsg = () => {
    if (!msgInput.trim() || !activeThread) return;
    const text = msgInput.trim(); setMsgInput('');
    setThreads(prev => prev.map(t => t.handle === activeThread
      ? { ...t, msgs:[...t.msgs, { from:'me', text }] } : t));
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
                    <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color||'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:22, fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>{initials}</div>
                    <button style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'#fff', border:'2px solid #e8e8e8', display:'grid', placeItems:'center', cursor:'pointer' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
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
                          renderTrigger={() => dialCode ? `${dialCode.f} ${dialCode.d}` : 'Select'}
                          renderItem={item => `${item.f} ${item.n} ${item.d}`}/>
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
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
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
                      renderItem={item => `${item.icon} ${item.v} — ${item.desc}`}/>
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
              </div>

              {/* ── City ── */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>🏙️ Location</div>
                <div>
                  <label style={labelStyle}>CITY</label>
                  <SearchDD value={cityVal}
                    onChange={item => setCityVal(item)}
                    items={MAJOR_CITIES}
                    matchFn={(item, q) => item.toLowerCase().includes(q.toLowerCase())}
                    renderTrigger={(val) => val || 'Select city…'}
                    renderItem={item => item}/>
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
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🚀</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No products yet</div>
                <p style={{ color:'#888', marginBottom:20 }}>Products you submit will appear here.</p>
                <button onClick={()=>navigate('/')} style={{ padding:'11px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Submit a Product 🚀
                </button>
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
                      ? <div style={{ padding:'24px 16px', fontSize:13, color:'#ccc' }}>No conversations yet.</div>
                      : threads.map(t => (
                          <div key={t.handle} className={`adm-thread${activeThread===t.handle?' sel':''}`} onClick={()=>setActiveThread(t.handle)}>
                            <div className="adm-thread-av">{t.initials}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="adm-thread-name">{t.name}</div>
                              <div className="adm-thread-prev">{t.msgs[t.msgs.length-1]?.text||''}</div>
                            </div>
                          </div>
                        ))
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
                      <div className="adm-chat-hd">{currentThread?.name}</div>
                      <div className="adm-bubbles">
                        {(currentThread?.msgs||[]).map((m,i) => (
                          <div key={i} className={`adm-bubble ${m.from==='me'?'mine':'theirs'}`}>{m.text}</div>
                        ))}
                      </div>
                      <div className="adm-composer">
                        <input className="adm-compose-input" value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                          placeholder="Type a message…" onKeyDown={e=>e.key==='Enter'&&sendMsg()}/>
                        <button className="adm-compose-send" onClick={sendMsg}>↑</button>
                      </div>
                    </>)}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
