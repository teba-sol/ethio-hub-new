// Standalone page - NO imports, NO providers
export default function Page() {
  return (
    <html>
      <head>
        <title>Payment Result</title>
        <style>{`
          body { margin: 0; font-family: system-ui, sans-serif; background: #faf8f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .c { background: white; border-radius: 32px; padding: 40px; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .i { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 40px; }
          .s { background: #dcfce7; color: #16a34a; }
          .f { background: #fee2e2; color: #dc2626; }
          h1 { font-size: 24px; margin: 0 0 12px; }
          p { color: #666; margin: 0 0 24px; }
          a { display: inline-block; padding: 16px 32px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; }
        `}</style>
      </head>
      <body>
        <div class="c">
          <div class="i s">✓</div>
          <h1>Payment Successful!</h1>
          <p>Your booking has been confirmed.</p>
          <a href="/">Back to Home</a>
        </div>
      </body>
    </html>
  );
}