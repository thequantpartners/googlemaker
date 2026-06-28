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
          <p>By accessing or using QSS, you agree to be bound by these Terms of Service. If you are using QSS on behalf of a law firm, agency, or other entity, you represent that you have the authority to bind such entity.</p>
          
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Description of Service & No Guarantee of Results</h2>
          <p>QSS provides automated Google Ads management software. Advertising is inherently unpredictable. We <strong>DO NOT</strong> guarantee specific advertising results, a specific Cost Per Acquisition (CPA), or Return on Investment (ROI). The tool operates algorithmically based on the parameters you define.</p>
          
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Assumption of Risk and Ad Spend Liability</h2>
          <p>You acknowledge that algorithms, AI models, and APIs are subject to latency, bugs, and unpredictable behavior. <strong>YOU ARE SOLELY RESPONSIBLE FOR YOUR GOOGLE ADS SPEND.</strong> QSS is not liable for any unintended ad spend, budget overruns, or erroneous campaign pauses/scalings. You agree to monitor your own ad accounts regularly.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Indemnification</h2>
          <p>You agree to defend, indemnify, and hold harmless QSS and TheQuantPartners from any claims, damages, or lawsuits arising from your use of the Service, including but not limited to claims from your clients, malpractice allegations, or violations of advertising regulations (e.g., Bar Association advertising rules).</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL GMAKER BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF AD SPEND, OR BUSINESS INTERRUPTION. IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY EXCEED THE AMOUNT PAID BY YOU TO US IN THE THREE (3) MONTHS PRECEDING THE CLAIM, OR $100 USD, WHICHEVER IS GREATER.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Mandatory Arbitration and Class Action Waiver</h2>
          <p>Any dispute arising out of or relating to these Terms shall be resolved through binding arbitration in the State of Delaware, rather than in court. You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Subscriptions and Payments</h2>
          <p>QSS is billed on a subscription basis. Our order process is conducted by our online reseller Lemon Squeezy, which is the Merchant of Record for all orders.</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at partners@thequantpartners.com.</p>
        </div>
      </div>
    </div>
  );
}
