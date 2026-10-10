import "../globals.css"; // Sesuaikan jika globals.css Anda ada di root app/

export default function AdminLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}