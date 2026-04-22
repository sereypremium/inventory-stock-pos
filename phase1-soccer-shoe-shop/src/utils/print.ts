interface PrintWindowOptions {
  title: string;
  body_html: string;
}

export function open_print_window({ title, body_html }: PrintWindowOptions) {
  const print_window = window.open('', '_blank', 'width=420,height=760');

  if (!print_window) {
    return;
  }

  print_window.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: "Public Sans", "Segoe UI", sans-serif;
            padding: 16px;
            color: #15221d;
          }

          .receipt {
            max-width: 360px;
            margin: 0 auto;
            border: 1px dashed #a9b7ac;
            padding: 16px;
          }

          .center {
            text-align: center;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .muted {
            color: #55635c;
            font-size: 12px;
          }

          hr {
            border: 0;
            border-top: 1px dashed #c8d0c7;
            margin: 12px 0;
          }

          .item {
            margin-bottom: 10px;
          }

          @media print {
            body {
              padding: 0;
            }

            .receipt {
              border: 0;
            }
          }
        </style>
      </head>
      <body>${body_html}</body>
    </html>
  `);
  print_window.document.close();
  print_window.focus();
  print_window.print();
}
