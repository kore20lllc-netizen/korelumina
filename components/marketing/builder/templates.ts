export interface Template {
  id: string;
  title: string;
  description: string;
  prompt: string;
  requiredPlan?: 'pro'; // Pro-only templates
  quality: number; // 1-5 quality score
  badge?: 'Recommended' | 'Best for Pro' | 'Advanced'; // Optional quality badge
}

export const TEMPLATES: Template[] = [
  // FREE TEMPLATES (5) - Listed first
  {
    id: 'nextjs-marketing',
    title: 'Next.js Marketing Site',
    description: 'Complete marketing website with hero, features, pricing, and contact form',
    quality: 5,
    badge: 'Recommended',
    prompt: `Create a complete Next.js marketing website with:
- Hero section with compelling headline and CTA buttons
- Features showcase section with icons and descriptions
- Pricing table with 3 tiers (Free, Pro, Enterprise)
- Contact form with validation
- Responsive navbar with mobile menu
- Footer with social links and site map
Use Tailwind CSS for styling and TypeScript for type safety. Make it modern, professional, and conversion-focused.`,
  },
  {
    id: 'startup-homepage',
    title: 'Startup Homepage',
    description: 'Modern startup landing page optimized for conversions',
    quality: 3,
    prompt: `Create a modern startup homepage with:
- Eye-catching hero section with product demo or screenshot
- Key value propositions (3 main benefits)
- Social proof section (logos of companies using it)
- How it works / Process section (3-4 steps)
- Testimonials carousel
- Pricing comparison table
- Call-to-action sections throughout
- Email waitlist signup
- Animated elements and smooth scrolling
Use Next.js, Tailwind CSS, Framer Motion for animations. Make it bold, modern, and startup-focused.`,
  },
  {
    id: 'portfolio-personal',
    title: 'Portfolio / Personal Site',
    description: 'Clean portfolio website for showcasing work and skills',
    quality: 3,
    prompt: `Create a personal portfolio website with:
- Hero section with introduction and profile photo
- About me section with bio and skills
- Projects showcase with cards/grid (title, description, image, tech stack, links)
- Skills section with technology icons or badges
- Work experience timeline
- Contact section with email and social links
- Blog section (optional, with featured posts)
- Resume download button
Use Next.js, TypeScript, Tailwind CSS. Make it clean, professional, and easy to navigate. Focus on showcasing work effectively.`,
  },
  {
    id: 'blog-content',
    title: 'Blog / Content Site',
    description: 'Clean blog with posts, categories, and reading experience',
    quality: 3,
    prompt: `Create a blog/content website with:
- Homepage with featured posts and recent articles
- Blog post listing with filters and search
- Individual post page with reading progress bar
- Categories and tags navigation
- Author bio section
- Related posts suggestions
- Newsletter signup form
- RSS feed support
- Dark mode toggle
Use Next.js, MDX for content, Tailwind CSS. Focus on reading experience and content discovery.`,
  },
  {
    id: 'simple-landing',
    title: 'Simple Landing Page',
    description: 'Clean one-page site with essential sections',
    quality: 3,
    prompt: `Create a simple, effective landing page with:
- Hero section with clear value proposition
- 3-4 key features or benefits
- Simple pricing section (optional)
- Contact form or email signup
- Footer with links
- Mobile responsive
Use Next.js, Tailwind CSS. Keep it clean, fast, and conversion-focused with minimal distractions.`,
  },
  // PRO TEMPLATES (5) - Listed after Free
  {
    id: 'saas-dashboard',
    title: 'SaaS Dashboard Scaffold',
    description: 'Admin dashboard with sidebar navigation, charts, and data tables',
    requiredPlan: 'pro',
    quality: 5,
    badge: 'Best for Pro',
    prompt: `Create a SaaS admin dashboard with:
- Sidebar navigation with sections for Dashboard, Users, Analytics, Settings
- Main dashboard with overview cards (users, revenue, growth metrics)
- Data table with pagination, sorting, and search
- Chart components for analytics (line chart, bar chart)
- User profile dropdown
- Dark mode toggle
Use Next.js, TypeScript, Tailwind CSS, and Recharts for charts. Include authentication layout ready for auth integration.`,
  },
  {
    id: 'production-starter',
    title: 'Production App Starter',
    description: 'Enterprise-ready app template with authentication, database, and deployment',
    requiredPlan: 'pro',
    quality: 5,
    badge: 'Best for Pro',
    prompt: `Create a production-ready application starter with:
- Complete authentication system (email/password, OAuth)
- User profile management
- Database integration with Prisma or similar ORM
- API routes with middleware (auth, rate limiting, error handling)
- SEO optimized (meta tags, sitemap, robots.txt)
- Analytics integration ready (Google Analytics placeholder)
- Environment variables configuration
- Error boundary and error tracking setup
- Loading states and skeleton screens
- Toast notifications system
- Responsive design for all screen sizes
- Docker configuration for deployment
Use Next.js 14+, TypeScript, Tailwind CSS, Prisma, NextAuth. Include all best practices for production apps.`,
  },
  {
    id: 'ai-chat-app',
    title: 'AI Chat App',
    description: 'Full-featured AI chat application with streaming responses',
    requiredPlan: 'pro',
    quality: 4,
    badge: 'Advanced',
    prompt: `Create an AI chat application with:
- Chat interface with message history
- Streaming response support
- Code syntax highlighting for code blocks
- Markdown rendering for formatted text
- Copy to clipboard for messages
- Clear conversation button
- Message input with auto-resize
- Loading states during AI response
- Error handling and retry logic
Use Next.js, TypeScript, Tailwind CSS, and integrate with OpenAI or similar API. Include rate limiting and token management.`,
  },
  {
    id: 'admin-panel-crud',
    title: 'Admin Panel (CRUD)',
    description: 'Full admin panel with CRUD operations for managing resources',
    requiredPlan: 'pro',
    quality: 4,
    badge: 'Advanced',
    prompt: `Create an admin panel with complete CRUD functionality:
- Resource management interface (Users, Products, or Orders)
- Create, Read, Update, Delete operations
- Data table with sorting, filtering, and pagination
- Form modals for create/edit operations
- Delete confirmation dialogs
- Search and filter functionality
- Bulk actions (select multiple items)
- Export to CSV functionality
- Role-based UI elements (admin vs user views)
Use Next.js, TypeScript, Tailwind CSS, and React Hook Form for forms. Include proper validation and error handling.`,
  },
  {
    id: 'internal-tool',
    title: 'Internal Tool Dashboard',
    description: 'Enterprise internal tool for team workflows and data management',
    requiredPlan: 'pro',
    quality: 4,
    badge: 'Advanced',
    prompt: `Create an internal tool dashboard for team use:
- Overview dashboard with key metrics and KPIs
- Team member management section
- Task/project tracking interface
- Document library or knowledge base
- Settings and configuration panel
- Activity feed or audit log
- Reports and analytics section
- Export functionality (PDF, CSV)
- Search across all resources
- Notification system
Use Next.js, TypeScript, Tailwind CSS. Include role-based access control UI and focus on productivity features.`,
  },
];
