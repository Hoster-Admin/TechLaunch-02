import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';

const SECTIONS = [
  {
    title:'1. Information We Collect',
    content:[
      { heading:'Account Information', text:'When you register, we collect your name, email address, and password. Optionally, you may provide a profile photo, bio, location, and links to your social profiles.' },
      { heading:'Product & Listing Data', text:'When you submit a product or company listing, we collect the information you provide including product name, description, website URL, tags, and media uploads.' },
      { heading:'Usage Data', text:'We automatically collect information about how you use the platform: pages visited, features used, search queries, upvotes, bookmarks, and session duration. This data is used to improve the product.' },
      { heading:'Communications', text:'If you use our messaging features, we store the content of those messages to deliver them to recipients and for moderation purposes.' },
    ]
  },
  {
    title:'2. How We Use Your Information',
    content:[
      { heading:'Platform Operation', text:'We use your information to create and manage your account, display your public profile, process product submissions, and enable community features like upvoting and bookmarking.' },
      { heading:'Communications', text:'We may send you notifications about activity on your listings, weekly digests, and important platform updates. You can opt out of marketing communications at any time from your settings.' },
      { heading:'Analytics & Improvement', text:'We analyze usage patterns to understand what features work well and where we can improve. This analysis is done in aggregate and does not identify individual users.' },
      { heading:'Safety & Moderation', text:'We use your information to detect spam, fraudulent activity, and policy violations. We may use automated systems and human review to ensure the platform remains safe and high-quality.' },
    ]
  },
  {
    title:'3. Information Sharing',
    content:[
      { heading:'Public Profile Information', text:'Your username, profile photo, bio, and public listings are visible to other users on the platform. This is a fundamental feature of a community platform.' },
      { heading:'Service Providers', text:'We share data with third-party service providers who help us operate the platform, including cloud hosting, email delivery, and analytics. These providers are contractually required to keep your data secure.' },
      { heading:'Legal Requirements', text:'We may disclose your information if required by law, court order, or governmental authority, or to protect the rights and safety of our users and platform.' },
      { heading:'No Sale of Data', text:'We do not sell, rent, or share your personal information with third parties for their marketing purposes.' },
    ]
  },
  {
    title:'4. Data Security',
    content:[
      { heading:'Security Measures', text:'We use industry-standard security measures including HTTPS encryption, hashed passwords, and access controls to protect your data. However, no system is completely secure.' },
      { heading:'Data Retention', text:'We retain your account information as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.' },
    ]
  },
  {
    title:'5. Your Rights',
    content:[
      { heading:'Access & Correction', text:'You can access and update your personal information through your account settings at any time.' },
      { heading:'Deletion', text:'You can request deletion of your account and associated data by contacting us at privacy@techlaunch.io. We will process your request within 30 days.' },
      { heading:'Data Portability', text:'You can request a copy of your data in a machine-readable format by contacting our support team.' },
    ]
  },
  {
    title:'6. Cookies',
    content:[
      { heading:'Essential Cookies', text:'We use cookies to keep you logged in and maintain your preferences. These are necessary for the platform to function.' },
      { heading:'Analytics Cookies', text:'We use analytics cookies to understand how users interact with the platform. You can opt out through your browser settings.' },
    ]
  },
  {
    title:'7. Contact Us',
    content:[
      { heading:'Privacy Questions', text:'If you have questions about this Privacy Policy or how we handle your data, please contact us at privacy@techlaunch.io.' },
    ]
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', background:'#fff', minHeight:'100vh' }}>
        {/* Header */}
        <div style={{ borderBottom:'1px solid #f0f0f0', padding:'clamp(28px,5vw,52px) clamp(16px,5vw,40px) 40px' }}>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <h1 style={{ fontSize:'clamp(24px,5vw,36px)', fontWeight:900, letterSpacing:'-.03em', marginBottom:10 }}>Privacy Policy</h1>
            <p style={{ fontSize:14, color:'#888', margin:0 }}>Last updated: March 1, 2026 · Effective: March 1, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth:760, margin:'0 auto', padding:'clamp(24px,5vw,48px) clamp(16px,5vw,40px) 80px' }}>
          <p style={{ fontSize:15, color:'#555', lineHeight:1.8, marginBottom:40 }}>
            Tech Launch MENA ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect information about you when you use our platform at tlmena.com.
          </p>

          {SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom:48 }}>
              <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-.02em', marginBottom:24, paddingBottom:14, borderBottom:'1px solid #f0f0f0' }}>{section.title}</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {section.content.map(item => (
                  <div key={item.heading}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0a0a0a', marginBottom:6 }}>{item.heading}</div>
                    <p style={{ fontSize:14, color:'#555', lineHeight:1.8, margin:0 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ background:'#fafafa', border:'1px solid #f0f0f0', borderRadius:16, padding:'24px 28px' }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Questions about this policy?</div>
            <p style={{ fontSize:14, color:'#666', margin:0 }}>Contact us at <a href="mailto:privacy@techlaunch.io" style={{ color:'var(--orange)', fontWeight:600 }}>privacy@techlaunch.io</a></p>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
