import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

const DEMO_PROFILES = {
  '@sara_builds': { handle:'@sara_builds', name:'Sara Al-Mahmoud', avatar:'SA', persona:'Founder', headline:'Founder @ Noon Academy · Edtech · 🇸🇦', bio:'Building the future of education in the Arab world. Ex-McKinsey. Mom of 3.', country:'sa', twitter:'sara_builds', linkedin:'sara-mahmoud', verified:true, followers:840, following:210, products:[2,5,8] },
  '@khalid_vc':   { handle:'@khalid_vc',   name:'Khalid Bin Tariq', avatar:'KT', persona:'Investor', headline:'Partner @ STV · Early Stage · 🇸🇦', bio:'Investing in MENA founders building category-defining companies.', country:'sa', twitter:'khalidvc', linkedin:'khalid-bin-tariq', verified:true, followers:1200, following:340, products:[1,4,12] },
  '@mona_codes':  { handle:'@mona_codes',  name:'Mona Hassan', avatar:'MH', persona:'Builder', headline:'Solo founder · AI tools · 🇪🇬', bio:'Vibe coder. Building AI micro-tools for Arab creators. 3 products shipped.', country:'eg', twitter:'mona_codes', linkedin:'mona-hassan-dev', verified:false, followers:290, following:180, products:[6,3,9] },
  '@ahmed_ux':    { handle:'@ahmed_ux',    name:'Ahmed Al-Rashidi', avatar:'AR', persona:'Product Manager', headline:'PM @ Tabby · Fintech · 🇦🇪', bio:'Product thinker. UXMENA community lead. Writing about Arab product culture.', country:'ae', twitter:'ahmed_ux', linkedin:'ahmed-rashidi-pm', verified:false, followers:560, following:220, products:[1,7,10] },
};

export const UIProvider = ({ children }) => {
  const [bookmarks,      setBookmarks]      = useState(new Set());
  const [votes,          setVotes]          = useState(new Set());
  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [dmThreads,      setDmThreads]      = useState({});
  const [following,      setFollowing]      = useState(new Set());
  const [followingIds,   setFollowingIds]   = useState(new Set());
  const [profiles]                          = useState(DEMO_PROFILES);
  const [submitOpen,     setSubmitOpen]     = useState(false);
  const [inboxOpen,      setInboxOpen]      = useState(false);
  const [inboxTarget,    setInboxTarget]    = useState(null);
  const [entityModal,    setEntityModal]    = useState(null);
  const [waitlistModal,  setWaitlistModal]  = useState(null);
  const [authModal,      setAuthModal]      = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');

  const loadNotifications = useCallback((apiNotifs) => {
    if (!Array.isArray(apiNotifs)) return;
    const mapped = apiNotifs.map(n => ({
      type: n.type || 'system',
      text: n.message || n.text || '',
      icon: n.type === 'upvote' ? '▲' : n.type === 'follow' ? '👤' : n.type === 'comment' ? '💬' : '🔔',
      time: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recently',
      unread: !n.read_at,
      handle: n.actor_handle || null,
    }));
    setNotifications(mapped);
    setUnreadCount(mapped.filter(n => n.unread).length);
  }, []);

  const loadBookmarks = useCallback((apiBookmarks) => {
    if (!Array.isArray(apiBookmarks)) return;
    const ids = new Set(apiBookmarks.map(b => b.id || b.product_id));
    setBookmarks(ids);
  }, []);

  const addNotification = useCallback((type, text, icon, handle) => {
    const notif = { type, text, icon: icon || '🔔', time: 'Just now', unread: true, handle };
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(n => n + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  }, []);

  const markOneRead = useCallback((idx) => {
    setNotifications(prev => {
      const updated = [...prev];
      if (updated[idx]?.unread) {
        updated[idx] = { ...updated[idx], unread: false };
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return updated;
    });
  }, []);

  const toggleBookmark = useCallback((id) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      next.add(id);
      return next;
    });
  }, []);

  const toggleVote = useCallback((id) => {
    setVotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      next.add(id);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((handle, name) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(handle)) { next.delete(handle); return next; }
      next.add(handle);
      return next;
    });
  }, []);

  const toggleFollowId = useCallback((id) => {
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      next.add(id);
      return next;
    });
  }, []);

  const openDM = useCallback((handle, name, avatar) => {
    setDmThreads(prev => {
      if (!prev[handle]) {
        return { ...prev, [handle]: [{ from: handle, text: `Hey! Thanks for reaching out 👋`, ts: 'Now' }] };
      }
      return prev;
    });
    setInboxTarget({ handle, name, avatar });
    setInboxOpen(true);
  }, []);

  const sendDM = useCallback((handle, text, myHandle) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setDmThreads(prev => ({
      ...prev,
      [handle]: [...(prev[handle] || []), { from: myHandle || 'me', text, ts }]
    }));
    setTimeout(() => {
      const replies = ['Thanks for reaching out! 🙌','That sounds interesting, tell me more.','Happy to connect! What are you working on?','Great to hear from you 👋','Let\'s schedule a call sometime!'];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const rts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setDmThreads(prev => ({
        ...prev,
        [handle]: [...(prev[handle] || []), { from: handle, text: reply, ts: rts }]
      }));
      addNotification('dm', `${handle} replied to your message`, '💬', handle);
    }, 1200);
  }, [addNotification]);

  return (
    <UIContext.Provider value={{
      bookmarks, toggleBookmark, loadBookmarks,
      votes, toggleVote,
      notifications, unreadCount, addNotification, markAllRead, markOneRead, loadNotifications,
      dmThreads, openDM, sendDM, inboxOpen, setInboxOpen, inboxTarget, setInboxTarget,
      following, toggleFollow,
      followingIds, toggleFollowId,
      profiles,
      submitOpen, setSubmitOpen,
      entityModal, setEntityModal,
      waitlistModal, setWaitlistModal,
      authModal, setAuthModal,
      searchQuery, setSearchQuery,
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be inside UIProvider');
  return ctx;
};
