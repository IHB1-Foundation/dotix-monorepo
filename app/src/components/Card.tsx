"use client";

import { ElementType, ReactNode } from "react";

export type CardVariant = "base" | "elevated" | "flat" | "interactive";
export type CardPadding = "none" | "compact" | "default" | "spacious";

const variantClass: Record<CardVariant, string> = {
  base: "card",
  elevated: "card-hero",
  flat: "card-subtle",
  interactive: "card transition-transform duration-200 hover:scale-[1.01] hover:border-ocean/40",
};

const paddingClass: Record<CardPadding, string> = {
  none: "",
  compact: "p-3",
  default: "p-4",
  spacious: "p-5",
};

type CardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children?: ReactNode;
  as?: ElementType;
};

export function Card({
  variant = "base",
  padding = "default",
  className = "",
  children,
  as: Tag = "div",
}: CardProps) {
  const classes = [variantClass[variant], paddingClass[padding], className]
    .filter(Boolean)
    .join(" ");

  return <Tag className={classes}>{children}</Tag>;
}
