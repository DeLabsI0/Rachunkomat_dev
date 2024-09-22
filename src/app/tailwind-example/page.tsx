'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function UpgradePlanPage() {
  const [isPersonal, setIsPersonal] = React.useState(true);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <h1 className="text-3xl font-semibold text-center text-gray-900 mb-8">
          Upgrade your plan
        </h1>

        <div className="flex justify-center mb-12">
          <div className="flex items-center bg-gray-100 rounded-full p-0.5">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${isPersonal ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
              onClick={() => setIsPersonal(true)}
            >
              Personal
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${!isPersonal ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
              onClick={() => setIsPersonal(false)}
            >
              Business
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <PlanCard
            title="Team"
            price="$25"
            subPrice="USD/month"
            description="Supercharge your team's work with a secure, collaborative workspace"
            buttonText="Add Team workspace"
            features={[
              "Everything in Plus",
              "Unlimited access to GPT-4o mini and higher message limits on GPT-4, GPT-4o, and tools like DALL-E, web browsing, data analysis, and more",
              "Create and share GPTs with your workspace",
              "Admin console for workspace management",
              "Team data excluded from training by default. Learn more"
            ]}
            footer="For 2+ users, billed annually"
          />
          <PlanCard
            title="Enterprise"
            price="Contact sales for pricing"
            description="Enterprise-grade security and privacy and the most powerful version of ChatGPT yet"
            buttonText="Contact Us"
            buttonVariant="outline"
            features={[
              "Everything in Plus",
              "Unlimited, high speed access to GPT-4, GPT-4o, GPT-4o mini, and tools like DALL-E, web browsing, data analysis, and more",
              "Expanded context window for longer inputs",
              "Enterprise data excluded from training by default & custom data retention windows. Learn more",
              "Admin controls, domain verification, and analytics",
              "Enhanced support & ongoing account management"
            ]}
            footer="For Larger Organizations"
          />
        </div>
      </motion.div>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  price: string;
  subPrice?: string;
  description: string;
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  features: string[];
  footer: string;
}

function PlanCard({ title, price, subPrice, description, buttonText, buttonVariant = 'default', features, footer }: PlanCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      <div className="flex items-baseline mb-3">
        <p className="text-3xl font-bold">{price}</p>
        {subPrice && <p className="text-gray-500 ml-1 text-sm">{subPrice}</p>}
      </div>
      <p className="text-gray-600 mb-5 text-sm">{description}</p>
      <button 
        className={`w-full mb-5 py-2 px-4 rounded-full font-medium text-sm ${
          buttonVariant === 'outline' 
            ? 'border border-gray-300 text-gray-800 hover:bg-gray-50' 
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {buttonText}
      </button>
      <ul className="space-y-2 mb-5">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-auto">{footer}</p>
    </div>
  );
}