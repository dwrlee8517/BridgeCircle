/**
 * Closes the sheet when navigation moves anywhere else under /ask — e.g.
 * the post-submit redirect to /ask/[id]. Without this catch-all, parallel
 * routes keep the previously active sheet rendered on soft navigation.
 */
export default function SheetCatchAll() {
  return null
}
