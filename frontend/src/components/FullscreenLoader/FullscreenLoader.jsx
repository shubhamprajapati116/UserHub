import "./FullScreenLoader.css";

function FullScreenLoader() {
  return (
    <div className="fullscreen-loader">
      <div className="loader-content">
        <h1 className="loader-logo">UserHub</h1>

        <div className="loader-spinner"></div>

        <p className="loader-text">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}

export default FullScreenLoader;


