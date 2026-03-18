import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';

export default function BookmarksPage({ onSignIn, onSignUp }) {
  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 80px' }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:20 }}>Bookmarks</div>
          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'80px 40px', textAlign:'center', color:'#bbb', fontSize:14 }}>
            No bookmarks yet
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
