export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-spinner" data-testid="loading-spinner">
      <div className="spinner"></div>
      <span>{text}</span>
    </div>
  );
}
