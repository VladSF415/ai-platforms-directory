import { z } from 'zod';

// Tool submission validation schema
export const SubmitToolSchema = z.object({
  name: z.string()
    .min(1, 'Tool name is required')
    .max(255, 'Tool name must be less than 255 characters')
    .trim(),

  website: z.string()
    .url('Must be a valid URL')
    .refine(
      (url) => url.startsWith('https://') || url.startsWith('http://'),
      'Website URL must start with https:// or http://'
    ),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),

  contactEmail: z.string()
    .email('Must be a valid email address'),

  category: z.string()
    .min(1, 'Category is required'),

  // Optional fields for featured listings
  wantsFeatured: z.boolean().optional().default(false),

  featuredTier: z.enum(['basic', 'premium', 'enterprise'])
    .optional()
    .nullable(),

  totalPrice: z.number()
    .min(0, 'Price must be non-negative')
    .optional(),
});

// Contact form validation schema
export const ContactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  email: z.string()
    .email('Must be a valid email address'),

  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim()
    .optional()
    .default('Contact from AI Platforms Directory'),

  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
});

// Chat message validation schema
export const ChatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long')
    .trim(),

  sessionId: z.string()
    .min(1, 'Session ID is required')
    .optional(),
});

// Helper function to validate and return errors
export function validateSchema(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
  }
}

// Sanitize HTML/XSS-prone content
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent basic HTML injection
    .trim();
}
