import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function NavItem({ icon: Icon, label, path }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <button className={"lg-tab" + (active ? " active" : "")} onClick={() => navigate(path)}>
      <Icon size={16} /> {label}
    </button>
  );
}