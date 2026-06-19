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
          <p>We collect information you provide directly to us, such as your Google Account details (email, name) when you sign in using Google OAuth. We also access your Google Ads data exclusively to provide our automation service. We do not store your Google Ads data longer than necessary for processing.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to operate, maintain, and improve our Service. Your Google Ads metrics are analyzed to pause underperforming campaigns and scale winning ones according to the settings you provide.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Information Sharing</h2>
          <p>We do not share your personal information or Google Ads data with third parties except as necessary to provide the service (e.g., payment processing via Lemon Squeezy, server hosting). We do not sell your data.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Security</h2>
          <p>We implement reasonable security measures to protect your information, including AES-256 encryption for sensitive credentials. However, no security system is impenetrable, and we cannot guarantee the absolute security of our systems.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
          <p>You have the right to access, update, or delete your information at any time. You can revoke our access to your Google Ads account directly from your Google Account security settings or by deleting your account in our dashboard.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at partners@thequantpartners.com.</p>
        </div>
      </div>
    </div>
  );
}
