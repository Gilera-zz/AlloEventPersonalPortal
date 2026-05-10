import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        style: {
          background: "#0A0A0A",
          color: "#F5F0EB",
          border: "1px solid rgba(212, 165, 116, 0.3)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
        },
        classNames: {
          toast: "group toast",
          description: "!text-[#F5F0EB]/60",
          actionButton: "!bg-[#D4A574] !text-[#0A0A0A]",
          cancelButton: "!bg-white/[0.06] !text-[#F5F0EB]/60",
          success: "!border-[rgba(212,165,116,0.4)]",
          error: "!border-[rgba(180,60,60,0.4)] !text-[#F5F0EB]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
