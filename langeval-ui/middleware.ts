import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // Match all pathnames except for
    // - API routes
    // - Static files (_next, images, etc.)
    // - Files with extensions (excluding .md for documentation)
    matcher: ['/((?!api|_next|_vercel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|pdf|woff2?)).*)']

};
