import { Metadata } from 'next';
import BlogsPage from '@/features/blogs/components/blogs-page';

export const metadata: Metadata = {
  title: 'Blogs',
  description: 'Manage blog posts and articles'
};

export default function Blogs() {
  return <BlogsPage />;
} 