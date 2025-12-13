import "./Badge.css";

export default function Badge({ children, variant = "default", size = "md", ...props }) {
  return (
    <span className={`badge badge-${variant} badge-${size}`} {...props}>
      {children}
    </span>
  );
}
