import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  // List of all locales that are supported
  locales: ['en', 'uk'],
  
  // Default locale if none is matched
  defaultLocale: 'en',
  
  // Automatically detect locale from Accept-Language header
  localeDetection: true
})

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
