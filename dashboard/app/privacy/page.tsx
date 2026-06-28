import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-20 px-6">
      <div className="max-w-3xl mx-auto bg-dark-card border border-dark-card-border p-10 rounded-2xl">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-white">Privacy Policy</h1>
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>Last updated: June 2026</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as your Google Account details (email, name) when you sign in using Google OAuth. We also request access to your Google Ads API to provide automation.</p>
          
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Client Confidentiality (For Law Firms)</h2>
          <p>QSS strictly accesses aggregate advertising metrics (clicks, impressions, cost, conversion counts). <strong>We do not read, extract, or store Personally Identifiable Information (PII) of your legal clients.</strong> We do not have access to your CRM, emails, or specific case details.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use your Google Ads metrics strictly to execute the algorithmic automation you configured (pausing underperforming ads and scaling winners). We do not use your data to train public AI models.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Information Sharing</h2>
          <p>We do not share your personal information or Google Ads data with third parties except as necessary to provide the service (e.g., payment processing via Lemon Squeezy). <strong>We will never sell your data to other law firms or third parties.</strong></p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Security</h2>
          <p>We implement strict security measures, including AES-256 encryption for API tokens. While we strive to protect your data, no internet transmission is 100% secure.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Your Rights & Revocation</h2>
          <p>You can revoke our access to your Google Ads account at any time directly from your Google Account security settings. Upon account deletion, all associated API tokens and metrics are permanently removed from our databases.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Contact Us</h2>
          <p>If you have any privacy concerns, please contact us at partners@thequantpartners.com.</p>
        </div>
      </div>
    </div>
  );
}
