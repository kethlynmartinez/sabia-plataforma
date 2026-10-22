import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    position="top-right"
    richColors
    closeButton
    className="toaster group"
    toastOptions={{
      classNames: {
        toast: "group toast font-dm group-[.toaster]:shadow-card-lg group-[.toaster]:rounded-xl",
        description: "group-[.toast]:text-muted-foreground",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
      },
    }}
    {...props}
  />
);

export { Toaster, toast };
