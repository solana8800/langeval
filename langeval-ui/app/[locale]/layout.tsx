import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from '@/app/providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LangEval | AI Studio",
    description: "Enterprise AI Agent LangEval Platform",
    icons: {
        icon: "/icon.svg",
    },
};

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Validate that the incoming `locale` parameter is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages({ locale });

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <NextIntlClientProvider messages={messages} locale={locale}>
                    <Providers>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
                <Toaster />
            </body>
        </html>
    );
}
