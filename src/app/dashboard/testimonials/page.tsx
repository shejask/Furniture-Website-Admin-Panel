import { Metadata } from 'next';
import TestimonialsPage from '@/features/testimonials/components/testimonials-page';

export const metadata: Metadata = {
  title: 'Testimonials',
  description: 'Manage customer testimonials and reviews'
};

export default function Testimonials() {
  return <TestimonialsPage />;
}
