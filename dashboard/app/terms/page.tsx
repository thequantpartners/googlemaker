import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-20 px-6">
      <div className="max-w-3xl mx-auto bg-dark-card border border-dark-card-border p-10 rounded-2xl">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-white">Terms of Service</h1>
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>Last updated: June 2026</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Agreement to Terms</h2>
          <p>By accessing or using GMaker, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
          <p>GMaker provides automated Google Ads management software. We do not guarantee specific advertising results, CPA, or ROI. The tool operates based on the parameters you define.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Subscriptions and Payments</h2>
          <p>GMaker is billed on a subscription basis. Our order process is conducted by our online reseller Lemon Squeezy. Lemon Squeezy is the Merchant of Record for all our orders. They process all payments and handle tax compliance.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Account Responsibilities</h2>
          <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You must not connect unauthorized Google Ads accounts.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Limitation of Liability</h2>
          <p>In no event shall GMaker, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at partners@thequantpartners.com.</p>
        </div>
      </div>
    </div>
  );
}
