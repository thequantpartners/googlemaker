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
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. General Refund Policy</h2>
          <p>We want you to be completely satisfied with GMaker. If you are not entirely happy with your subscription, we offer a 14-day money-back guarantee for all new subscriptions.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Eligibility for Refunds</h2>
          <p>To be eligible for a refund, you must request it within 14 days of your initial purchase. Refunds are only applicable to your first subscription cycle. Renewals are not eligible for refunds unless required by local law.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Process for Requesting a Refund</h2>
          <p>To request a refund, please contact our support team at partners@thequantpartners.com with your order details (processed by Lemon Squeezy). We will review your request and process the refund to your original payment method within 5-10 business days.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Cancellations</h2>
          <p>You can cancel your subscription at any time from your dashboard or via your Lemon Squeezy receipt link. Canceling your subscription will stop future billing, but you will retain access to the service until the end of your current billing cycle.</p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions about our Refund Policy, please contact us at partners@thequantpartners.com.</p>
        </div>
      </div>
    </div>
  );
}
