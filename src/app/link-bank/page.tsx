'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase-auth';
import LogoutButton from '@/app/components/LogoutButton';
import Image from 'next/image';

interface Institution {
  id: string;
  name: string;
  logo: string;
}

interface Country {
  code: string;
  name: string;
}

export default function LinkBank() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [result, setResult] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (country) {
      fetchInstitutions();
    }
  }, [country]);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/gocardless/institutions');
      const data = await response.json();

      if (response.ok) {
        const countryList: Country[] = data.map((code: string) => ({
          code,
          name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
        }));
        setCountries(countryList);
        
        // Set the country from the URL parameter or default to the first country
        const countryFromUrl = searchParams.get('country');
        if (countryFromUrl) {
          setCountry(countryFromUrl);
        } else {
          setCountry(countryList[0]?.code || '');
        }
      } else {
        setResult(`Error: ${JSON.stringify(data)}`);
      }
    } catch (error: unknown) {
      console.error('Error in fetchCountries:', error);
      if (error instanceof Error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(`An unknown error occurred: ${JSON.stringify(error)}`);
      }
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`/api/gocardless/institutions?country=${country}`);
      const data = await response.json();

      if (response.ok) {
        setInstitutions(data);
        setResult('');
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult('An unknown error occurred');
      }
    }
  };

  const handleInstitutionSelect = async (institutionId: string) => {
    console.log('Institution selected:', institutionId);
    setSelectedInstitution(institutionId);
    setResult(`Selected institution ID: ${institutionId}`);
    await createRequisition(institutionId);
  };

  const createRequisition = async (institutionId: string) => {
    console.log('Creating requisition for institution:', institutionId);
    try {
      const newReference = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch('/api/gocardless/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution_id: institutionId,
          redirect: `http://localhost:3000/callback?country=${country}`,
          reference: newReference,
          user_language: 'EN',
          user_id: user.uid, // Add the user ID to the requisition
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Requisition response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Construct the redirect URL correctly
      const redirectUrl = new URL(data.link);
      redirectUrl.searchParams.append('requisition_id', data.id);
      redirectUrl.searchParams.append('ref', data.reference);
      
      console.log('Redirecting to:', redirectUrl.toString());
      router.push(redirectUrl.toString());
    } catch (error) {
      console.error('Error creating requisition:', error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Link Your Bank</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Select Country</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <div
                key={institution.id}
                className={`relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 cursor-pointer ${
                  selectedInstitution === institution.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => handleInstitutionSelect(institution.id)}
              >
                <div className="flex-shrink-0">
                  <Image 
                    src={institution.logo} 
                    alt={institution.name} 
                    width={40} 
                    height={40} 
                    className="h-10 w-10 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback-logo.png"; // Make sure to add a fallback logo in your public folder
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <a href="#" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">{institution.name}</p>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {result && (
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Result</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <pre>{result}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}