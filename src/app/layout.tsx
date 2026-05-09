import { Providers } from '@/components/Providers';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import '@/index.css';

export const metadata = {
  title: 'EthioHub - Ethiopian Cultural Experiences',
  description: 'Discover Ethiopia Through Handmade Art & Cultural Experiences',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
