/**
 * Layout racine du groupe Studio (non localisé).
 * Le Studio Sanity gère son propre habillage plein écran.
 */
export const metadata = {
  title: "Administration — SP Smart",
  robots: { index: false, follow: false },
};

export default function StudioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
