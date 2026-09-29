import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { StoreProvider } from '@/lib/store'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600'],
})

export const metadata: Metadata = {
  title: 'onrecord — your past clients hear from you every month',
  description:
    'One email on the first, built from the deeds and tax records on your past clients\u2019 actual property. Not a Zestimate. Not a newsletter you have to write. $19 a month.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} bg-surface`}
    >
      <body className="font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
