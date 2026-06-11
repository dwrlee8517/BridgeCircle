/**
 * Ask segment layout with a parallel `@sheet` slot. Soft navigations to
 * /ask/new are intercepted into a side panel over the current page (results
 * stay visible while composing); hard loads and shared links still get the
 * full /ask/new page. See @sheet/(.)new.
 */
export default function AskLayout({
  children,
  sheet,
}: {
  children: React.ReactNode
  sheet: React.ReactNode
}) {
  return (
    <>
      {children}
      {sheet}
    </>
  )
}
