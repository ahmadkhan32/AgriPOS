import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="author" content="SabrWare" />
        <meta name="company" content="SabrWare" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}