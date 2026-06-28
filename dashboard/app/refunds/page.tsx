import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-20 px-6">
      <div className="max-w-3xl mx-auto bg-dark-card border border-dark-card-border p-10 rounded-2xl">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-white">Refund Policy</h1>
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>Last updated: June 2026</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Software Subscription Refunds</h2>
          <p>We offer a 14-day money-back guarantee for your initial QSS subscription fee. If the software does not meet your expectations, contact us within 14 days of your first purchase for a full refund of the subscription cost.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Absolutely NO Refunds for Ad Spend</h2>
          <p><strong>QSS is a management tool, not an advertising platform.</strong> You pay Google directly for your ad clicks. Under no circumstances will QSS refund, reimburse, or credit you for any money spent on Google Ads, even if such spend occurred due to algorithmic actions, delays, or software bugs.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Eligibility for Refunds</h2>
          <p>To be eligible for a subscription refund, you must request it within 14 days of your initial purchase. Renewals and subsequent billing cycles are final and non-refundable.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Process for Requesting a Refund</h2>
          <p>To request a refund for the software fee, please contact our support team at partners@thequantpartners.com with your order details (processed by Lemon Squeezy). We will process the refund within 5-10 business days.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Cancellations</h2>
          <p>You can cancel your subscription at any time from your dashboard or via your Lemon Squeezy receipt. Canceling stops future billing, but you will retain access until the end of your current cycle.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Contact Us</h2>
          <p>If you have any questions about our Refund Policy, please contact us at partners@thequantpartners.com.</p>
        </div>
      </div>
    </div>
  );
}
