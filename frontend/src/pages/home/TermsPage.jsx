import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';

const SECTIONS = [
  {
    title:'1. Acceptance of Terms',
    content:'By creating an account or using Tech Launch MENA (tlmena.com), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the platform. We may update these terms at any time, and continued use of the platform constitutes acceptance of any changes.'
  },
  {
    title:'2. Account Registration',
    items:[
      'You must be at least 13 years old to create an account.',
      'You are responsible for maintaining the security of your account credentials.',
      'You must provide accurate and complete information when registering.',
      'You are responsible for all activity that occurs under your account.',
      'One person may not maintain multiple accounts. Duplicate accounts will be removed.',
    ]
  },
  {
    title:'3. Product & Company Listings',
    items:[
      'You may only submit products or companies that you own or have authorization to list.',
      'All listings must be genuine and accurately described. Misleading or false listings will be removed.',
      'Spam, low-quality, or duplicate submissions are prohibited.',
      'We reserve the right to remove any listing at our discretion, with or without notice.',
      'By submitting a listing, you grant us a non-exclusive license to display and promote it on the platform.',
      'Products must be real, functional, and accessible to users unless clearly marked as "Coming Soon".',
    ]
  },
  {
    title:'4. Community Guidelines',
    items:[
      'Treat other community members with respect. Harassment, abuse, and hate speech are strictly prohibited.',
      'Do not spam upvotes, engage in vote manipulation, or coordinate inauthentic activity.',
      'Do not share spam, malicious links, or content that violates any laws.',
      'Do not impersonate other people, companies, or organizations.',
      'Do not share private information about other users without their consent.',
      'Constructive feedback is welcome; personal attacks are not.',
    ]
  },
  {
    title:'5. Intellectual Property',
    content:'All content on Tech Launch MENA, including the logo, design, code, and editorial content, is owned by or licensed to Tech Launch MENA. You retain ownership of content you post. By posting content, you grant us a worldwide, royalty-free license to display, reproduce, and distribute that content in connection with operating the platform.'
  },
  {
    title:'6. Prohibited Activities',
    items:[
      'Attempting to access, scrape, or extract data from the platform using automated tools.',
      'Attempting to reverse-engineer or compromise the security of the platform.',
      'Using the platform for any illegal activity or in violation of any applicable law.',
      'Attempting to interfere with the normal operation of the platform.',
      'Creating fake accounts or using the platform to commit fraud.',
      'Uploading malware, viruses, or any harmful code.',
    ]
  },
  {
    title:'7. Disclaimers & Limitation of Liability',
    content:'Tech Launch MENA is provided "as is" without warranties of any kind. We do not warrant that the platform will be uninterrupted, error-free, or completely secure. We are not responsible for the accuracy of user-submitted content. To the maximum extent permitted by law, Tech Launch MENA shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.'
  },
  {
    title:'8. Termination',
    content:'We reserve the right to suspend or terminate your account at any time for violations of these terms, fraudulent activity, or for any other reason at our discretion. You may delete your account at any time from your settings. Upon termination, your right to use the platform ceases immediately.'
  },
  {
    title:'9. Governing Law',
    content:'These Terms of Use are governed by the laws of the United Arab Emirates. Any disputes arising from these terms or your use of the platform shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.'
  },
  {
    title:'10. Contact',
    content:'If you have questions about these terms, please contact us at legal@techlaunch.io. We aim to respond within 5 business days.'
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', background:'#fff', minHeight:'100vh' }}>
        {/* Header */}
        <div style={{ borderBottom:'1px solid #f0f0f0', padding:'clamp(28px,5vw,52px) clamp(16px,5vw,40px) 40px' }}>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <h1 style={{ fontSize:'clamp(24px,5vw,36px)', fontWeight:900, letterSpacing:'-.03em', marginBottom:10 }}>Terms of Use</h1>
            <p style={{ fontSize:14, color:'#888', margin:0 }}>Last updated: March 1, 2026 · Effective: March 1, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth:760, margin:'0 auto', padding:'clamp(24px,5vw,48px) clamp(16px,5vw,40px) 80px' }}>
          <p style={{ fontSize:15, color:'#555', lineHeight:1.8, marginBottom:40 }}>
            Please read these Terms of Use carefully before using the Tech Launch MENA platform. These terms govern your access to and use of our services.
          </p>

          {SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom:44 }}>
              <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-.02em', marginBottom:16, paddingBottom:14, borderBottom:'1px solid #f0f0f0' }}>{section.title}</h2>
              {section.content && <p style={{ fontSize:14, color:'#555', lineHeight:1.85, margin:0 }}>{section.content}</p>}
              {section.items && (
                <ul style={{ paddingLeft:0, margin:0, listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:'#555', lineHeight:1.7 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--orange)', flexShrink:0, marginTop:7 }}/>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div style={{ background:'#fafafa', border:'1px solid #f0f0f0', borderRadius:16, padding:'24px 28px' }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Questions about these terms?</div>
            <p style={{ fontSize:14, color:'#666', margin:0 }}>Contact us at <a href="mailto:legal@techlaunch.io" style={{ color:'var(--orange)', fontWeight:600 }}>legal@techlaunch.io</a></p>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
