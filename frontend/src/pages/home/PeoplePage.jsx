import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const MENA_COUNTRIES = [
  { value:'Saudi Arabia', label:'🇸🇦 Saudi Arabia' },
  { value:'UAE',          label:'🇦🇪 UAE'           },
  { value:'Egypt',        label:'🇪🇬 Egypt'         },
  { value:'Jordan',       label:'🇯🇴 Jordan'        },
  { value:'Kuwait',       label:'🇰🇼 Kuwait'        },
  { value:'Qatar',        label:'🇶🇦 Qatar'         },
  { value:'Bahrain',      label:'🇧🇭 Bahrain'       },
  { value:'Oman',         label:'🇴🇲 Oman'          },
  { value:'Morocco',      label:'🇲🇦 Morocco'       },
  { value:'Tunisia',      label:'🇹🇳 Tunisia'       },
  { value:'Lebanon',      label:'🇱🇧 Lebanon'       },
  { value:'Iraq',         label:'🇮🇶 Iraq'          },
  { value:'Palestine',    label:'🇵🇸 Palestine'     },
  { value:'Libya',        label:'🇱🇾 Libya'         },
  { value:'Algeria',      label:'🇩🇿 Algeria'       },
  { value:'Sudan',        label:'🇸🇩 Sudan'         },
  { value:'Yemen',        label:'🇾🇪 Yemen'         },
  { value:'Syria',        label:'🇸🇾 Syria'         },
];


function AvatarCircle({ user, size = 48 }) {
  if (user?.avatar_url) {
    return (
      <img src={user.avatar_url} alt={user.name}
        style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
    );
  }
  const color = user?.avatar_color || '#E15033';
  const initials = (user?.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex',
      alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800,
      fontSize:size*0.35, flexShrink:0, fontFamily:'DM Sans,sans-serif' }}>
      {initials}
    </div>
  );
}

function PersonCard({ person, currentUser }) {
  const [following, setFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const handleFollow = async (e) => {
    e.preventDefault();
    if (!currentUser) { toast.error('Sign in to follow people'); return; }
    if (person.id === currentUser.id) return;
    setLoadingFollow(true);
    try {
      const res = await usersAPI.follow(person.id);
      setFollowing(res.data?.data?.following ?? !following);
    } catch { toast.error('Failed to follow'); }
    finally { setLoadingFollow(false); }
  };

  const isMe = currentUser?.id === person.id;

  return (
    <Link to={`/u/${person.handle}`} style={{ textDecoration:'none', color:'inherit' }}>
      <div style={{ background:'#fff', border:'1.5px solid #ebebeb', borderRadius:16, padding:'20px 20px 16px',
        transition:'box-shadow .15s, border-color .15s', cursor:'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor='#ddd'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#ebebeb'; }}>

        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:12 }}>
          <AvatarCircle user={person} size={48}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:15, fontWeight:800, color:'#0a0a0a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {person.name}
              </span>
              {person.verified && <span title="Verified" style={{ fontSize:14 }}>✅</span>}
            </div>
            <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>@{person.handle}</div>
          </div>
          {!isMe && (
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button onClick={handleFollow} disabled={loadingFollow}
                style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700,
                  border:`1.5px solid ${following?'#e8e8e8':'var(--orange)'}`,
                  background:following?'#f8f8f8':'var(--orange)',
                  color:following?'#666':'#fff', cursor:'pointer', transition:'all .15s' }}>
                {loadingFollow ? '…' : following ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>

        {person.headline && (
          <div style={{ fontSize:13, color:'#444', marginBottom:8, lineHeight:1.4,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {person.headline}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {person.persona && (
            <span style={{ fontSize:11, fontWeight:700, color:'#888', background:'#f4f4f4',
              padding:'3px 10px', borderRadius:20 }}>
              {person.persona}
            </span>
          )}
          {person.country && (
            <span style={{ fontSize:11, color:'#aaa' }}>{person.country}</span>
          )}
          <span style={{ fontSize:11, color:'#aaa', marginLeft:'auto' }}>
            {person.followers_count || 0} {person.followers_count === 1 ? 'follower' : 'followers'}
          </span>
        </div>
      </div>
    </Link>
  );
}

const PERSONA_OPTIONS = [
  { value:'Founder',         label:'Founder 🚀' },
  { value:'Investor',        label:'Investor 💰' },
  { value:'Builder',         label:'Builder ⚡' },
  { value:'Product Manager', label:'PM 🧠' },
  { value:'Accelerator',     label:'Accelerator 🏢' },
  { value:'Enthusiast',      label:'Enthusiast ⭐' },
];

function CountryDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val) => {
    onChange(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const label = selected.length === 0
    ? '🌍 All Countries'
    : selected.length === 1
      ? MENA_COUNTRIES.find(c => c.value === selected[0])?.label || selected[0]
      : `${selected.length} countries`;

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ padding:'8px 12px', border:`1.5px solid ${open ? 'var(--orange)' : '#e8e8e8'}`, borderRadius:10,
          fontSize:13, fontFamily:'inherit', background:'#fff', cursor:'pointer', display:'flex',
          alignItems:'center', gap:6, whiteSpace:'nowrap', color: selected.length ? '#111' : '#555' }}>
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)':'rotate(0deg)', transition:'transform .2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:200, background:'#fff',
          border:'1.5px solid #ebebeb', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,.1)',
          minWidth:210, maxHeight:280, overflowY:'auto', padding:'6px 0' }}>
          {MENA_COUNTRIES.map(c => {
            const checked = selected.includes(c.value);
            return (
              <div key={c.value} onClick={() => toggle(c.value)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px',
                  cursor:'pointer', background: checked ? '#fff8f6':'transparent',
                  transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = checked ? '#fff0ec':'#f8f8f8'}
                onMouseLeave={e => e.currentTarget.style.background = checked ? '#fff8f6':'transparent'}>
                <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked ? 'var(--orange)':'#ccc'}`,
                  background: checked ? 'var(--orange)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize:13 }}>{c.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PeopleContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [people, setPeople]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  const [search,   setSearch]   = useState(searchParams.get('q') || '');
  const [personas, setPersonas] = useState(() => (searchParams.get('persona') || '').split(',').filter(Boolean));
  const [countries, setCountries] = useState(() => (searchParams.get('country') || '').split(',').filter(Boolean));

  const load = useCallback(async (pg = 1, reset = false, overridePersonas, overrideCountries) => {
    setLoading(true);
    const pList = overridePersonas !== undefined ? overridePersonas : personas;
    const cList = overrideCountries !== undefined ? overrideCountries : countries;
    try {
      const res = await usersAPI.people({
        search:  search || undefined,
        persona: pList.length ? pList.join(',') : undefined,
        country: cList.length ? cList.join(',') : undefined,
        page: pg, limit: 24,
      });
      const data = res.data?.data || [];
      setPeople(prev => reset || pg === 1 ? data : [...prev, ...data]);
      setTotal(res.data?.pagination?.total || 0);
      setPage(pg);
    } catch { toast.error('Failed to load people'); }
    finally { setLoading(false); }
  }, [search, personas, countries]);

  useEffect(() => { load(1, true); }, [load]);

  const togglePersona = (val) => {
    const next = personas.includes(val) ? personas.filter(v => v !== val) : [...personas, val];
    setPersonas(next);
    load(1, true, next, countries);
  };

  const handleCountriesChange = (updater) => {
    setCountries(prev => {
      const next = updater(prev);
      load(1, true, personas, next);
      return next;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search)          params.q = search;
    if (personas.length) params.persona = personas.join(',');
    if (countries.length) params.country = countries.join(',');
    setSearchParams(params);
    load(1, true);
  };

  const hasFilters = Boolean(search) || personas.length > 0 || countries.length > 0;

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setSearch(''); setPersonas([]); setCountries([]);
    navigate('/people', { replace: true });
    load(1, true, [], []);
  };

  return (
    <div>
      <div style={{ background:'#fff', border:'1.5px solid #ebebeb', borderRadius:16, padding:'16px 20px', marginBottom:24 }}>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
          <div style={{ flex:'1 1 200px', position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, handle, headline…"
              style={{ width:'100%', padding:'8px 12px 8px 30px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
          </div>
          <CountryDropdown selected={countries} onChange={handleCountriesChange}/>
          <button type="submit" style={{ padding:'8px 20px', borderRadius:10, border:'none', background:'var(--orange)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Search
          </button>
          {hasFilters && (
            <button type="button" onClick={(e) => handleClear(e)}
              style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#f8f8f8', fontSize:13, color:'#888', cursor:'pointer' }}>
              Clear
            </button>
          )}
        </form>

        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {PERSONA_OPTIONS.map(p => {
            const active = personas.includes(p.value);
            return (
              <button key={p.value} type="button" onClick={() => togglePersona(p.value)}
                style={{ padding:'5px 13px', borderRadius:20, border:`1.5px solid ${active ? 'var(--orange)':'#e8e8e8'}`,
                  background: active ? '#fff4f0':'#fff', color: active ? 'var(--orange)':'#555',
                  fontSize:12.5, fontWeight: active ? 700:400, cursor:'pointer', fontFamily:'inherit',
                  transition:'all .15s' }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && (
        <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>
          {total} {total === 1 ? 'person' : 'people'} found
        </div>
      )}

      {loading && people.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Loading…</div>
      ) : people.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No people found</div>
          <div style={{ fontSize:14 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginBottom:24 }}>
            {people.map(p => <PersonCard key={p.id} person={p} currentUser={user}/>)}
          </div>
          {people.length < total && (
            <div style={{ textAlign:'center' }}>
              <button onClick={() => load(page + 1)} disabled={loading}
                style={{ padding:'10px 28px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', color:'#444' }}>
                {loading ? 'Loading…' : `Load more (${total - people.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PeoplePage({ onSignIn }) {
  return (
    <div style={{ minHeight:'100vh', background:'#f8f8f8' }}>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)' }}>
        <div className="page-header-section">
          <div className="page-header-inner">
            <div>
              <h1>👥 People</h1>
              <p>Discover founders, investors, builders and makers across MENA</p>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px clamp(16px,3vw,32px) 80px' }}>
          <PeopleContent/>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
