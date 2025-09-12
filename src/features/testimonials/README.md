# Testimonials Feature

This feature allows administrators to manage customer testimonials and reviews for the e-commerce platform.

## Features

- **Add Testimonials**: Create new testimonials with customer names, descriptions, and photos
- **Edit Testimonials**: Modify existing testimonial information
- **Delete Testimonials**: Remove testimonials with confirmation dialog
- **Search & Filter**: Search testimonials by name or description
- **Image Upload**: Upload customer photos with Firebase storage integration

## Fields

### Required Fields
- **Name**: Customer's full name
- **Description**: The testimonial text/review
- **Image**: Customer's photo
- **Alt Text**: Accessibility description for the image

## Components

- `TestimonialsPage`: Main page component with table and form management
- `TestimonialForm`: Modal form for adding/editing testimonials
- `TestimonialsTable`: Data table displaying all testimonials with actions

## Usage

1. Navigate to `/dashboard/testimonials`
2. Click "Add Testimonial" to create a new testimonial
3. Fill in the required fields:
   - **Name**: Enter customer's name
   - **Description**: Enter testimonial text
   - **Image**: Upload customer's photo
4. Use the table to view, edit, or delete existing testimonials

## Data Storage

Testimonials are stored in Firebase Realtime Database under the `testimonials` node with the following structure:

```json
{
  "testimonials": {
    "testimonial_id": {
      "name": "Customer Name",
      "description": "Testimonial text",
      "imageUrl": "firebase_storage_url",
      "altText": "Image description",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Navigation

The testimonials page is accessible via the sidebar navigation under "Testimonials" with the message square icon.
