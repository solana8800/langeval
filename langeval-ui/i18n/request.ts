import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
    // Validate that the incoming `locale` parameter is valid
    // and fallback to default if necessary
    const targetLocale = (locale && routing.locales.includes(locale as any))
        ? locale
        : routing.defaultLocale;

    return {
        locale: targetLocale,
        messages: (await import(`../messages/${targetLocale}.json`)).default
    };
});
