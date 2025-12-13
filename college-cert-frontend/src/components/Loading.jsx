import "./Loading.css";

export default function Loading({ size = "default", text = null, fullScreen = false }) {
  const sizeClasses = {
    small: "loading-small",
    default: "loading-default",
    large: "loading-large"
  };

  const content = (
    <div className={`loading-container ${fullScreen ? "loading-fullscreen" : ""}`}>
      <div className={`loading-spinner-modern ${sizeClasses[size]}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  return content;
}
