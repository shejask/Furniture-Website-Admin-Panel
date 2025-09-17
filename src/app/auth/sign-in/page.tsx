import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Shopping Lala | Sign In',
  description: 'Sign in to your Shopping Lala vendor account.'
};

export default function Page() {
  return <SignInViewPage />;
}
