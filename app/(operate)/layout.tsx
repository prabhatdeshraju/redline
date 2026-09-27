/* The Operate route group.

   Its only job is to bring in the Operate stylesheet, so the reviewed app-shell
   CSS loads on the task screens and nowhere else. The landing page at / keeps
   its own stylesheet and is untouched by this.

   The root layout owns <html> and <body>; this adds no element of its own, so
   the sheet stays a child of the body as it is in the static reference. */

import type { ReactNode } from "react";

import "@/app/operate.css";

export default function OperateLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
