import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import './globals.css'

export const metadata = {
  title: 'AgriPOS — Pakistan\'s #1 Agricultural POS System | SabrWare',
  description: 'Complete multi-tenant SaaS POS for agricultural businesses in Pakistan. Manage inventory, sales, customers, suppliers and more. Start your 14-day free trial today.',
  keywords: 'POS Pakistan, Agricultural POS, Inventory Management, SaaS POS, Agri Software',
  authors: [{ name: 'SabrWare' }],
  openGraph: {
    title: 'AgriPOS — Smart Business Management for Agricultural Shops',
    description: 'Pakistan\'s most complete agricultural POS system. Online + Offline. Multi-user. Multi-branch. Start free.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="author" content="SabrWare" />
        <meta name="company" content="SabrWare" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}