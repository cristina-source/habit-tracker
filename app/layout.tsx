import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Disciplina — Sistema de Execução Pessoal',
  description: 'O teu sistema de execução pessoal. Track hábitos, jejum, treino e progresso.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" className={`${dmSans.variable} h-full`} style={{ colorScheme: 'dark' }}>
      <body className="min-h-full" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, system-ui, sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
