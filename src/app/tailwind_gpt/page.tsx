'use client';

import { motion } from 'framer-motion';

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  buttonText: string;
  isContact?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, buttonText, isContact }) => {
  return (
    <motion.div
      className="bg-white border rounded-lg p-6 max-w-sm shadow-lg"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      <p className="text-4xl font-bold text-gray-900 my-4">{price}</p>
      <ul className="mb-6">
        {features.map((feature, index) => (
          <li key={index} className="text-gray-700 flex items-center space-x-2 mb-2">
            <svg
              className="w-5 h-5 text-green-500" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 text-center text-white rounded-md ${isContact ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}>
        {buttonText}
      </button>
    </motion.div>
  );
};

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
        TailwindGPT Pricing
      </h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <PricingCard
          title="Team"
          price="$25 USD/month"
          features={[
            'Everything in Plus',
            'Unlimited access to GPT-4o mini',
            'Create and share GPTs with workspace',
            'Admin console for workspace management',
            'Team data excluded from training by default',
          ]}
          buttonText="Add Team workspace"
        />
        <PricingCard
          title="Enterprise"
          price="Contact sales for pricing"
          features={[
            'Everything in Plus',
            'Unlimited access to GPT-4o mini and more',
            'Expanded context window',
            'Enterprise data excluded from training',
            'Admin controls, domain verification, and analytics',
          ]}
          buttonText="Contact Us"
          isContact={true}
        />
      </div>
    </div>
  );
};

export default PricingPage;
