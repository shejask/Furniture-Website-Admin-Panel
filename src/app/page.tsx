import { redirect } from 'next/navigation';

export default async function Page() {
  // Redirect to sign-in page
  redirect('/auth/sign-in');
}
