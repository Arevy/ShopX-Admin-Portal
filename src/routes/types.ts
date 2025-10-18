export type RouteMatcher = (pathname: string) => boolean

export interface RouteDefinition {
  /** Stable identifier used for lookups and translation keys */
  id: string
  /** Path segment for Next.js navigation */
  path: string
  /** Translation key that resolves the human readable label */
  translationKey: string
  /** Translation namespace backing the page-level copy */
  translationNamespace: string
  /** Optional emoji or icon metadata used by the sidebar */
  emoji?: string
  /** Controls whether the route should appear in the primary navigation */
  showInNavigation?: boolean
  /** Optional explicit route matching logic */
  match?: RouteMatcher
  /** Optional order hint used when building navigation lists */
  order?: number
}

export interface NavigationRoute extends RouteDefinition {
  /** Emoji is required for navigation entries */
  emoji: string
  showInNavigation?: true
}
