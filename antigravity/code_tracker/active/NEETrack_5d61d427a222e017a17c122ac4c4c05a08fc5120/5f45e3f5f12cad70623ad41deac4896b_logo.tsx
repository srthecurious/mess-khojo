®import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const Logo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-auto h-10 aspect-square", className)}
    {...props}
  >
    <Image
      src="/icon.png"
      alt="NEETrack Logo"
      fill
      sizes="40px"
      className="object-contain"
      priority
    />
  </div>
));
Logo.displayName = "Logo";

export { Logo };
 *cascade08*cascade08Ã *cascade08ÃÄ*cascade08Äæ *cascade08æè *cascade08èî *cascade08îğ*cascade08ğ× *cascade08×Ù *cascade08Ùå *cascade08åé*cascade08éş *cascade08ş€ *cascade08€£ *cascade08£» *cascade08»× *cascade08×Û*cascade08Ûê *cascade08êë *cascade08ëï *cascade08ïñ *cascade08ñ¤ *cascade08¤¥*cascade08¥© *cascade08©ª*cascade08ª® *cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc51202<file:///c:/Apps/NEETrack/NEETrack/src/components/ui/logo.tsx:!file:///c:/Apps/NEETrack/NEETrack