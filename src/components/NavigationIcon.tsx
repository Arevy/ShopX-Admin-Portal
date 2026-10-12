const paths: Record<string, string> = {
  '/': 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  '/orders': 'M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 7h6M9 11h6',
  '/products': 'm3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4',
  '/users':
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87',
  '/support':
    'M3 14v-2a9 9 0 0 1 18 0v5a4 4 0 0 1-4 4h-3M3 12h3v7H3zM18 12h3v7h-3z',
  '/cms': 'M4 3h16v18H4zM8 7h8M8 11h8M8 15h5',
}
export const NavigationIcon = ({ path }: { path: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={paths[path] ?? paths['/']} />
  </svg>
)
