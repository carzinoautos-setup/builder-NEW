import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Database } from "lucide-react";

import Header from "./Header";

export function NavigationHeader({
  topTemplate,
}: {
  topTemplate?: React.ReactNode;
}) {
  const hideHeader = import.meta.env.VITE_HIDE_HEADER === "true";
  if (hideHeader) return null;
  return <Header topTemplate={topTemplate} />;
}
