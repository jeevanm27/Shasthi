import './Spinner.css';

export default function Spinner({ size = 32 }) {
  return (
    <div className="spinner" style={{ width: size, height: size }} aria-label="Loading" role="status">
      <div />
    </div>
  );
}
