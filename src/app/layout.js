import "./globals.css";

// -- Context Providers
import AuthProvider from "@/context/AuthContext";
import DbProvider from "@/context/DbContext";

import Authenticator from "@/components/auth/Authenticator";

import { OverlayProvider } from "@/context/ui/OverlayContext";



export const metadata = {
  title: "Osis",
  description: "Osis Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
            <body className="bg-surface font-body-md text-on-surface">
      <AuthProvider>
        <DbProvider>
          
          <Authenticator>
            
              <OverlayProvider>{children}</OverlayProvider>

          </Authenticator>


        </DbProvider>
      </AuthProvider>
            </body>
    </html>
  );
}
     
