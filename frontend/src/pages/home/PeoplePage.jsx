import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const MENA_COUNTRIES = [
  'Saudi Arabia','UAE','Kuwait','Qatar','Bahrain','Oman','Jordan','Lebanon',
  'Egypt','Morocco','Tunisia','Algeria','Libya','Iraq','Syria','Yemen','Palestine','Sudan',
];

const PERSONAS = [
  { value:'', label:'All Personas' },
  { value:'Founder', label:'Founder 🚀' },
  { value:'Investor', label:'Investor 💰' },
  { value:'Builder', label:'Builder ⚡' },
  { value:'Product Manager', label:'PM 🧠' },
  { value:'Accelerator', label:'Accelerator 🏢' },
  { value:'Enthusiast', label:'Enthusiast ⭐' },
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

        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
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
            <button onClick={handleFollow} disabled={loadingFollow}
              style={{ flexShrink:0, padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700,
                border:`1.5px solid ${following?'#e8e8e8':'var(--orange)'}`,
                background:following?'#f8f8f8':'var(--orange)',
                color:following?'#666':'#fff', cursor:'pointer', transition:'all .15s' }}>
              {loadingFollow ? '…' : following ? 'Following' : 'Follow'}
            </button>
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

export default function PeoplePage({ onSignIn }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [people, setPeople]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);

  const [search,  setSearch]  = useState(searchParams.get('q') || '');
  const [persona, setPersona] = useState(searchParams.get('persona') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');

  const load = useCallback(async (pg = 1, reset = false) => {
    setLoading(true);
    try {
      const res = await usersAPI.people({ search: search||undefined, persona: persona||undefined, country: country||undefined, page: pg, limit: 24 });
      const data = res.data?.data || [];
      setPeople(prev => reset || pg === 1 ? data : [...prev, ...data]);
      setTotal(res.data?.pagination?.total || 0);
      setPage(pg);
    } catch { toast.error('Failed to load people'); }
    finally { setLoading(false); }
  }, [search, persona, country]);

  useEffect(() => { load(1, true); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search)  params.q = search;
    if (persona) params.persona = persona;
    if (country) params.country = country;
    setSearchParams(params);
    load(1, true);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8f8f8' }}>
      <Navbar/>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px 80px' }}>

        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.03em', marginBottom:6 }}>People</h1>
          <p style={{ fontSize:14, color:'#888' }}>Discover founders, investors, builders and makers across MENA</p>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} style={{ background:'#fff', border:'1.5px solid #ebebeb', borderRadius:16, padding:'16px 20px', marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:'1 1 200px', position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, handle, headline…"
              style={{ width:'100%', padding:'8px 12px 8px 30px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
          </div>

          <select value={persona} onChange={e => setPersona(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', cursor:'pointer' }}>
            {PERSONAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', cursor:'pointer' }}>
            <option value="">All Countries</option>
            {MENA_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button type="submit" style={{ padding:'8px 20px', borderRadius:10, border:'none', background:'var(--orange)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Search
          </button>

          {(search || persona || country) && (
            <button type="button" onClick={() => { setSearch(''); setPersona(''); setCountry(''); setSearchParams({}); load(1, true); }}
              style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#f8f8f8', fontSize:13, color:'#888', cursor:'pointer' }}>
              Clear
            </button>
          )}
        </form>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>
            {total} {total === 1 ? 'person' : 'people'} found
          </div>
        )}

        {/* Grid */}
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
      <Footer/>
    </div>
  );
}
