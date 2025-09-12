import { BlogForm } from "@/components/blog/blog-form";

export default function BlogPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Create Blog Post</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new blog post.
        </p>
        <div className="mt-6">
          <BlogForm />
        </div>
      </div>
    </div>
  );
}
