# Ukrainian Translation & Notary Booking System

A simple, bilingual (English/Ukrainian) online booking platform for a small translation and notary service in Edmonton, Canada.

## Problem Solved

Eliminates the need for the business owner to sit in the office all day waiting for walk-in clients. Clients can book appointments online, and the owner only comes to the office when appointments are scheduled.

## Key Features

- ✅ **Simple Booking Flow**: 3-step process optimized for older, less tech-savvy users
- ✅ **Bilingual Support**: Full English and Ukrainian interface
- ✅ **Mobile-Friendly**: Works perfectly on phones and tablets
- ✅ **Admin Dashboard**: Easy appointment management
- ✅ **Email Notifications**: Automatic confirmations and reminders
- ✅ **Document Upload**: Clients can upload translation documents in advance
- ✅ **Smart Scheduling**: Prevents double-booking, respects working hours
- ✅ **Low Cost**: $0-2/month to operate

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Hosting**: Vercel
- **Styling**: Tailwind CSS
- **i18n**: next-intl

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Resend account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ukrainian-notary-booking.git
cd ukrainian-notary-booking
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials.

4. Set up the database:
   - Go to your Supabase project
   - Run the SQL from `database_schema.sql`

5. Run development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

See the comprehensive [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ukrainian-notary-booking)

## Project Structure

```
├── app/
│   ├── [locale]/          # Internationalized pages
│   │   ├── page.tsx       # Public booking page
│   │   └── admin/         # Admin dashboard
│   └── api/               # API routes
├── lib/                   # Utilities and configs
├── messages/              # Translation files (en, uk)
├── database_schema.sql    # Database setup
└── DEPLOYMENT_GUIDE.md    # Detailed setup guide
```

## Usage

### For Clients

1. Visit the website
2. Select a service (Notary, Translation, Consultation)
3. Choose date and time
4. Enter contact information
5. Optionally upload documents
6. Confirm booking
7. Receive email confirmation

### For Admin

1. Login at `/admin`
2. View pending appointments
3. Approve or reject bookings
4. Mark appointments as completed
5. Block off unavailable times

## Configuration

### Services

Edit services in Supabase → Table Editor → services table

### Working Hours

Edit hours in Supabase → Table Editor → working_hours table

### Email Templates

Edit templates in `app/api/send-notification/route.ts`

## Cost

- **Vercel**: Free tier (hobby projects)
- **Supabase**: Free tier (500MB database)
- **Resend**: Free tier (3,000 emails/month)

**Total**: $0-2/month for typical small business usage

## Future Enhancements

- [ ] Online payment integration (Stripe)
- [ ] SMS reminders (Twilio)
- [ ] Multiple staff members
- [ ] Client account system
- [ ] Analytics dashboard
- [ ] Automated reminder emails

## Support

For detailed setup instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## License

MIT License - Feel free to use for your own business
