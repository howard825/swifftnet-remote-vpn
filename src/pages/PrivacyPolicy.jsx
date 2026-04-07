import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col items-center animate-in fade-in duration-500">
      <div className="max-w-4xl w-full bg-slate-900/50 p-8 md:p-12 rounded-[40px] border border-slate-800 shadow-2xl space-y-8">
        
        {/* HEADER */}
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-blue-500 leading-none">Privacy Policy</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Last Updated: March 31, 2026</p>
          </div>
          {/* BINAGO: Ginawang Link para gumana ang URL change */}
          <Link 
            to="/" 
            className="bg-slate-800 hover:bg-blue-600 px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-700"
          >
            Back
          </Link>
        </header>

        {/* CONTENT AREA */}
        <div className="text-slate-300 text-sm space-y-8 font-medium leading-relaxed overflow-y-auto max-h-[65vh] pr-4 custom-scrollbar">
          
          <p>
            This Privacy Policy outlines how <strong>SwifftNET</strong> (vpn.swifftnet.site) collects, uses, and protects your data when you use our Remote Access and VPN services. As a Philippine-based provider, we are committed to upholding the <strong>Data Privacy Act of 2012 (RA 10173)</strong> and ensuring your network activity remains secure and private.
          </p>

          <section className="space-y-4">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">1. Information We Collect</h2>
            <p>To provide reliable remote access, we collect two categories of information:</p>
            
            <div className="pl-6 space-y-4 border-l-2 border-blue-500/30">
              <div>
                <h3 className="text-white font-bold uppercase text-xs mb-2">A. Account Information</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Personal Identity:</strong> Full Name, Contact Number, and Email Address.</li>
                  <li><strong>Billing Details:</strong> Records of payments and subscription status.</li>
                  <li><strong>Credentials:</strong> Username and encrypted passwords for VPN access.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold uppercase text-xs mb-2">B. Technical & Usage Logs</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Connection Metadata:</strong> Time of connection/disconnection and total bandwidth used.</li>
                  <li><strong>IP Addresses:</strong> Your assigned internal VPN IP and the public IP used to connect.</li>
                  <li><strong>Device Info:</strong> Basic identifiers of the device connecting to the server.</li>
                </ul>
              </div>
            </div>

            <p className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-xs italic">
              <strong>Note:</strong> We do <strong>not</strong> monitor, record, or store the specific websites you visit or the content of your communications while connected to our Remote Access service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">2. Purpose of Data Processing</h2>
            <p>We use your data strictly for the following purposes:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Service Delivery:</strong> Authenticating your access and managing your remote connection.</li>
              <li><strong>Security:</strong> Monitoring for unauthorized login attempts or network abuse.</li>
              <li><strong>Support:</strong> Troubleshooting connectivity issues for your specific account.</li>
              <li><strong>Legal Compliance:</strong> Adhering to Philippine laws, such as the <strong>Anti-Child Pornography Act (RA 9775)</strong>, which requires ISPs to preserve certain access logs (origin/destination of access) for a limited period.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">3. Data Retention & Security</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Encryption:</strong> All remote access traffic is secured using industry-standard protocols (e.g., WireGuard, OVPN, L2TP, or SSTP) with <strong>AES-256 bit encryption</strong>.</li>
              <li><strong>Retention:</strong> We only keep personal data for as long as your account is active or as required by NTC regulations. Connection logs are automatically purged after <strong>60 days</strong> unless a longer period is legally mandated.</li>
              <li><strong>Access Control:</strong> Access to our backend systems (MikroTik/RouterOS) is strictly limited to authorized SwifftNET administrators.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">4. Your Rights as a Data Subject</h2>
            <p>Under the Data Privacy Act of 2012, you have the right to:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Be Informed:</strong> Know how your data is being used (as detailed here).</li>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Rectify:</strong> Correct any inaccuracies in your account details.</li>
              <li><strong>Object/Erasure:</strong> Request the deletion of your account and data, subject to legal retention requirements.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">5. Third-Party Sharing</h2>
            <p>We <strong>never sell</strong> your personal data. Sharing only occurs with:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Payment Processors:</strong> To verify and complete your subscription payments.</li>
              <li><strong>Law Enforcement:</strong> Only when presented with a valid court order or subpoena in accordance with Philippine law.</li>
            </ul>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">6. Contact Us</h2>
            <p>If you have questions about this policy or wish to exercise your privacy rights, please contact our Data Protection Officer:</p>
            <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 space-y-1">
              <p className="font-black text-white uppercase text-sm">SwifftNET Support</p>
              <p className="text-blue-400 font-bold">Email: ramoshowardkingsley58@gmail.com</p>
              <p className="text-slate-500 text-xs">Location: Santa Ana Cagayan Valley</p>
              <p className="text-slate-500 text-xs">Website: vpn.swifftnet.site</p>
            </div>
          </section>
        </div>

        {/* FOOTER ACTION */}
        <footer className="pt-4">
          <Link 
            to="/" 
            className="w-full inline-block text-center bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]"
          >
            Back to Login
          </Link>
        </footer>
      </div>
    </div>
  );
}