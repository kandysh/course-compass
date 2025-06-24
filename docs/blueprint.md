# **App Name**: Course Compass

## Core Features:

- Course Overview: Display the list of courses with course name, instructor, thumbnail and due date.
- Progress Tracking: Show course completion status using a progress bar.
- Mark as Completed: Allow users to mark courses as completed.
- AI Chatbot: Implement an LLM-powered chatbot to answer student questions using provided context from documentation. Acts as an intelligent tool for retrieving info.
- User Authentication: Implement separate login access for students and instructors.
- Responsive Layout: Responsive design that works well on both desktop and mobile devices.

## Style Guidelines:

- Minimalistic, distraction-free dashboards.
- High contrast, accessible color palette (WCAG AA compliant).
- Clear information hierarchy: course progress and due dates stand out.
- Friendly but professional look (no cartoonish elements).
- RoleColorPrimary `#3B82F6` (blue-500, for buttons, links, highlights)
- Secondary `#6366F1` (indigo-500, for alternate CTAs)
- Accent `#F59E0B` (amber-500, for progress bars, alerts)
- Background `#F9FAFB` (gray-50)
- Surface / Card `#FFFFFF`
- Border / Divider `#E5E7EB` (gray-200)
- Text Primary `#111827` (gray-900)
- Text Secondary `#6B7280` (gray-500)
- Error `#EF4444` (red-500)
- Success `#10B981` (emerald-500)
- Base Font: `Inter` or `Poppins`, fallback to `sans-serif`
- Heading 1: `2rem` (32px) — dashboard titles
- Heading 2: `1.5rem` (24px) — section headers
- Body: `1rem` (16px)
- Small text: `0.875rem` (14px)
- Headings: `600-700`
- Body: `400-500`
- Buttons: `500-600`
- Container width: max `1280px`, padding `1rem`
- Grid system: Tailwind’s `grid` and `flex` utilities
- Cards: rounded corners `lg`, shadow `md`, padding `4`
- Primary: blue background, white text, rounded `md`
- Secondary: outlined, indigo border, indigo text
- Disabled: gray-300 background, gray-500 text
- Border `gray-300`, focus `blue-500` ring
- Padding `2`, rounded `md`
- Height: `0.75rem`
- Rounded full
- Background: `gray-200`
- Progress: `amber-500`
- `text-xs`, `font-medium`, `bg-gray-100`, rounded `full`, `px-2`, `py-0.5`
- Base unit: `0.25rem` (4px)
- Padding / margin: use multiples of 4px
- Avoid cramped designs: min `p-4` on containers, `gap-4` in grids
- Use **Lucide-react** (successor of Feather Icons) — clean, minimal vector icons.
- Consistent icon size: `1.25rem` (20px)
- Use `framer-motion` for page transitions and button interactions.
- Keep transitions subtle: `ease-in-out`, `150-300ms`.
- Background: `#1F2937` (gray-800)
- Surface: `#374151` (gray-700)
- Text: `#F9FAFB`
- Framework: Next.js (TypeScript recommended)
- Styling: TailwindCSS with `@apply` in components where reusable patterns occur
- Component naming: PascalCase for files and functions
- /components, /pages, /styles (for Tailwind config + globals), /lib (API utilities, chatbot wrapper), /hooks