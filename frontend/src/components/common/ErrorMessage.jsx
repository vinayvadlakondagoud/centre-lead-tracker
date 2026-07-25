export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message" data-testid="error-message">
      <p>Error: {message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          Retry
        </button>
      )}
    </div>
  );
}
