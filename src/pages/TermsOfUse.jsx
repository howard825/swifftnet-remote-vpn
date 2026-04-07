import React from 'react';
import { Link } from 'react-router-dom'; // Siguradong imported ito

export default function TermsOfUse() { // Tinanggal na natin ang { setView } prop
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col items-center animate-in fade-in duration-500">
      <div className="max-w-4xl w-full bg-slate-900/50 p-8 md:p-12 rounded-[40px] border border-slate-800 shadow-2xl space-y-8">
        
        {/* HEADER */}
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-emerald-500 leading-none">Terms of Service</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Last Updated: March 31, 2026</p>
          </div>
          {/* BINAGO NATIN ITO: Mula button, ginawa nating Link */}
          <Link 
            to="/" 
            className="bg-slate-800 hover:bg-blue-600 px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-700"
          >
            Back
          </Link>
        </header>

        {/* CONTENT AREA */}
        <div className="text-slate-300 text-sm space-y-8 font-medium leading-relaxed overflow-y-auto max-h-[65vh] pr-4 custom-scrollbar">
          
          <p className="italic text-slate-400">
            This Terms of Service agreement governs your use of <strong>SwifftNET REMOTE Access</strong> and the services provided via <strong>vpn.swifftnet.site</strong>. By accessing or using our services, you agree to be bound by these terms.
          </p>

          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">1. Acceptance of Terms</h2>
            <p>By subscribing to or using SwifftNET services, you acknowledge that you have read, understood, and agreed to these Terms of Service. If you are using this service on behalf of a business or entity, you represent that you have the authority to bind that entity to these terms.</p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">2. Description of Service</h2>
            <p>SwifftNET provides remote access and VPN solutions primarily designed for network management, secure browsing, and remote connectivity. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time to maintain network integrity or perform scheduled maintenance.</p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-4">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">3. User Responsibilities & Conduct</h2>
            <p>You are responsible for all activity that occurs under your account. To maintain the security and quality of our network, you agree <strong>not</strong> to:</p>
            <div className="pl-6 space-y-4 border-l-2 border-emerald-500/30">
              <p><strong>Illegal Activity:</strong> Use the service for any purpose that violates Philippine laws, including the <strong>Cybercrime Prevention Act of 2012 (RA 10175)</strong>.</p>
              <p><strong>Abuse:</strong> Attempt to gain unauthorized access to our servers, perform DDoS attacks, or distribute malware.</p>
              <p><strong>Reselling:</strong> Sell, trade, or transfer your account to third parties without express written consent from SwifftNET management.</p>
              <p><strong>Spamming:</strong> Use our remote access tunnels to send unsolicited bulk emails or commercial advertisements.</p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">4. Payment and Subscriptions</h2>
            <div className="space-y-3 text-slate-400">
              <p><strong>Fees:</strong> Access to SwifftNET Remote Access is provided on a subscription basis. Current rates are listed on our official website.</p>
              <p><strong>Refunds:</strong> Due to the digital nature of our service, payments are generally non-refundable. However, issues involving technical failure on our end will be reviewed on a case-by-case basis.</p>
              <p><strong>Late Payments:</strong> Failure to settle subscription renewals may result in the automatic suspension of your remote access tunnel.</p>
            </div>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">5. Service Level & Disclaimers</h2>
            <div className="space-y-3 text-slate-400">
              <p><strong>"As-Is" Basis:</strong> The service is provided "as is" and "as available." While we strive for 99.9% uptime, we do not guarantee that the service will be uninterrupted or error-free.</p>
              <p><strong>Speed & Latency:</strong> Connection speeds may vary depending on your local ISP (e.g., PLDT, Globe, Starlink), network congestion, and geographical distance from our nodes.</p>
              <p><strong>Data Loss:</strong> SwifftNET is not responsible for any data loss or security breaches resulting from user negligence, such as weak passwords or shared credentials.</p>
            </div>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, <strong>SwifftNET</strong> and its developers shall not be liable for any indirect, incidental, or consequential damages (including loss of profits or data) arising out of your use or inability to use the service.</p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">7. Termination</h2>
            <p>We reserve the right to terminate or suspend your access immediately, without prior notice, if you breach these terms or engage in activities that threaten the stability of our network. Upon termination, your right to use the service will cease immediately.</p>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">8. Governing Law</h2>
            <p>These terms are governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>. Any legal actions arising from these terms shall be settled in the proper courts of the Philippines.</p>
          </section>

          {/* SECTION 9 */}
          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">9. Changes to Terms</h2>
            <p>SwifftNET reserves the right to update these terms at any time. We will notify active subscribers of significant changes via the email address associated with their account or through a notice on vpn.swifftnet.site.</p>
          </section>

          {/* CONTACT */}
          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">Contact Information</h2>
            <p>For any inquiries regarding these terms, please reach out to:</p>
            <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 space-y-1">
              <p className="font-black text-white uppercase text-sm">SwifftNET Management</p>
              <p className="text-emerald-400 font-bold">Email: ramoshowardkingsley58@gmail.com</p>
              <p className="text-slate-500 text-xs">Website: vpn.swifftnet.site</p>
            </div>
          </section>
        </div>

        {/* FOOTER ACTION */}
        <footer className="pt-4">
          <Link 
            to="/" 
            className="w-full inline-block text-center bg-emerald-600 hover:bg-emerald-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            I Accept These Terms
          </Link>
        </footer>
      </div>
    </div>
  );
}