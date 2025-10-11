# Fast Track Leaderboard System

A comprehensive leaderboard and client management system built for Fast Track programs, featuring real-time analytics, client insights, and associate management tools.

## 🚀 Features

### **Client Dashboard**
- **Executive Summary**: Key metrics display with 6 core KPIs
- **Interactive Leaderboard**: Real-time ranking with privacy controls
- **Client Detail Modal**: Comprehensive client information and sprint progress
- **SSDB Insights**: "Start, Stop, Do Better" recommendations

### **Associate Dashboard**
- **Client Management**: Create, update, and manage client profiles
- **Analytics Cards**: Performance metrics and quality scores
- **Score Updates**: Real-time score management with validation
- **Access Code Management**: Generate and manage client access codes
- **SSDB Management**: Create and edit client insights
- **Activity Logging**: Track all system activities

### **Technical Features**
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Custom Fonts**: Fast Track brand typography (Plaak 3 Trial, Reforma LL)
- **Real-time Updates**: Live data synchronization
- **Privacy Controls**: Secure client data access
- **Database Integration**: Supabase backend with RLS policies

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **UI Components**: shadcn/ui, Lucide React icons
- **Styling**: Custom Fast Track brand colors and fonts
- **Database**: PostgreSQL with Row Level Security

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fast-track-leaderboard.git
   cd fast-track-leaderboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the SQL scripts in your Supabase SQL Editor:
     - `database-setup.sql` - Main database structure and sample data
     - `database-ssdb-table.sql` - SSDB insights table
     - `database-ssdb-fix.sql` - Fix any database issues

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Use test access codes:
     - Client: `CFL2025`, `MAXCITY2025`
     - Associate: `ELENA001`, `VASIL001`, `ANI001`

## 🎨 Design System

### **Brand Colors**
- **Primary**: Black (#000000), White (#FFFFFF), Red (#FF0000)
- **Accent**: Grey (#999999), Light Grey (#E5E5E5)
- **Status**: Green (#22C55E), Amber (#F59E0B)

### **Typography**
- **Headings**: Plaak 3 Trial (Bold, 700)
- **Body Text**: Reforma LL (Regular, 400)
- **Sizes**: 96px (ranks), 72px (scores), 12px (labels)

### **Layout**
- **Mobile-first**: Responsive grid system
- **Spacing**: Consistent padding and margins
- **Components**: Reusable UI components with shadcn/ui

## 📊 Database Schema

### **Core Tables**
- **`teams`**: Client/team information and rankings
- **`associates`**: Associate user accounts
- **`sprints`**: Master list of 30 program sprints
- **`ssdb_insights`**: Start, Stop, Do Better recommendations
- **`activity_log`**: System activity tracking

### **Key Features**
- **Row Level Security**: Secure data access
- **Foreign Keys**: Relational data integrity
- **Indexes**: Optimized query performance
- **Policies**: Granular access control

## 🔐 Access Codes

### **Client Access**
- Format: `[TEAM][YEAR]` (e.g., `CFL2025`, `MAXCITY2025`)
- Features: View own data, leaderboard, SSDB insights

### **Associate Access**
- Format: `[NAME][001]` (e.g., `ELENA001`, `VASIL001`)
- Features: Manage clients, update scores, create insights

### **Admin Access**
- Codes: `ADMIN001`, `FASTTRACK_ADMIN`
- Features: Full system access

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Manual Deployment**
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Configure your hosting platform

## 📁 Project Structure

```
fast-track-leaderboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Login page
│   │   ├── client/page.tsx    # Client dashboard
│   │   └── associate/page.tsx  # Associate dashboard
│   ├── components/            # React components
│   │   ├── client/           # Client-specific components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utility libraries
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions
├── public/                   # Static assets
│   ├── fonts/               # Custom font files
│   └── logo.png             # Fast Track logo
├── database-setup.sql       # Database initialization
├── database-ssdb-table.sql  # SSDB table creation
└── database-ssdb-fix.sql   # Database fixes
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is proprietary software for Fast Track programs. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in `/docs`

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added SSDB insights system
- **v1.2.0**: Enhanced associate dashboard
- **v1.3.0**: Custom fonts and branding

---

**Built with ❤️ for Fast Track programs**