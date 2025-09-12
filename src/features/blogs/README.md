# Blogs Feature

A comprehensive blog management system for creating, editing, and managing blog posts with rich content and media support.

## Features

- **Add Blog Posts**: Create new blog posts with title, category, description, content, and featured image
- **Edit Blog Posts**: Modify existing blog post information
- **Delete Blog Posts**: Remove blog posts with confirmation dialog
- **Search & Filter**: Search blogs by title, description, or category
- **Image Upload**: Upload featured images with Firebase storage integration
- **Category Management**: Predefined categories for organizing blog posts
- **Publishing Control**: Toggle between draft and published status
- **Rich Content**: Support for long-form content with textarea editor

## Fields

### Required Fields
- **Title**: Blog post title
- **Category**: Blog post category (free-form input)
- **Description**: Brief description of the blog post
- **Content**: Full blog post content
- **Image**: Featured image for the blog post
- **Alt Text**: Accessibility description for the image

### Optional Fields
- **Published Status**: Enable/disable blog post visibility (defaults to draft)

## Components

- **BlogsPage**: Main page component managing state and Firebase operations
- **BlogForm**: Modal form for adding/editing blog posts
- **BlogsTable**: Data table displaying blogs with search and actions

## Usage

1. Navigate to `/dashboard/blogs`
2. Click "Add Blog Post" to create a new blog post
3. Fill in the required fields:
   - **Title**: Enter blog post title
   - **Category**: Select from predefined categories
   - **Description**: Enter brief description
   - **Content**: Write full blog post content
   - **Image**: Upload featured image
4. Use the table to view, edit, or delete existing blog posts
5. Toggle publishing status using the switch in the form

## Data Storage

Blogs are stored in Firebase Realtime Database under the `blogs` path with the following structure:

```json
{
  "blogId": {
    "title": "Blog Post Title",
    "category": "technology",
    "description": "Blog post description",
    "content": "Full blog post content...",
    "imageUrl": "firebase_storage_url",
    "altText": "Image description",
    "isPublished": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Categories

Categories are now free-form input fields, allowing users to create any category they want. This provides flexibility for different types of content and organizational needs.

## Navigation

The blogs page is accessible via the sidebar navigation under "Blogs" with the file text icon.
