import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import "./textContainer.css";

interface TextContainerProps {
  children: ReactNode;
  className?: string;
}
export function TextContainer({ children, className }: TextContainerProps) {
  return <div className={twMerge("text-container", className)}>{children}</div>;
}
