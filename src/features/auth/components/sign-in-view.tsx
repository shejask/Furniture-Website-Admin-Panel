import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import SignInForm from './sign-in-form';

export const metadata: Metadata = {
  title: 'Shopping Lala | Vendor Portal',
  description: 'Sign in to your Shopping Lala vendor account.'
};

export default function SignInViewPage() {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/examples/authentication'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Login
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        {/* Background Image */}
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: 'url("https://plus.unsplash.com/premium_photo-1688125414822-c1daf8543ffb?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
          }}
        />
        <div className='absolute inset-0 bg-black/50' />
        
        {/* Shopping Lala Logo */}
        <div className='relative z-20 flex items-center text-2xl font-bold'>
          <div className='mr-3 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
            <span className='text-white font-bold text-lg'>SL</span>
          </div>
          <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
            Shopping Lala
          </span>
        </div>
        
        {/* Inspiring Quotes */}
        <div className='relative z-20 mt-auto space-y-6'>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold text-white'>
              Welcome to Your Vendor Portal
            </h2>
          </div>
          
          <div className='space-y-4'>
            <blockquote className='space-y-2'>
              <p className='text-lg italic'>
                &ldquo;The best way to predict the future is to create it. Start selling today!&rdquo;
              </p>
              <footer className='text-sm text-gray-300'>— Shopping Lala Team</footer>
            </blockquote>
          </div>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <SignInForm />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking continue, you agree to our{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
