import { isAutoRegisterEnabled } from '@/lib/cloudflare';
import Image from 'next/image';
import SignUpForm from './SignUpForm';
import RegistrationClosed from './RegistrationClosed';
import { organizationLogoSvgPath, shouldShowOrganizationLogo } from '@/lib/branding';

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'example.com';

/**
 * Sign Up Page - Server Component
 * Checks registration status at build/request time to avoid client-side flash
 */
export default function SignUpPage() {
  const registrationEnabled = isAutoRegisterEnabled();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          {shouldShowOrganizationLogo && (
            <Image
              src={organizationLogoSvgPath}
              alt={`${APEX_DOMAIN} organization logo`}
              width={240}
              height={72}
              className="h-14 w-auto mx-auto mb-4"
              priority
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{APEX_DOMAIN}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {registrationEnabled ? 'Create your email account' : 'Registration Status'}
          </p>
        </div>

        {/* Conditionally render based on server-side check */}
        {registrationEnabled ? <SignUpForm /> : <RegistrationClosed />}
      </div>
    </div>
  );
}