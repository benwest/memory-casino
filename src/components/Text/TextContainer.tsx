import { ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import "./textContainer.css";

export function TextContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={twMerge("text-container", className)} {...props} />;
}
