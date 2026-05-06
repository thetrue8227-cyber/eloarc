export default function Logo({ height = 36, className = '' }) {
  return (
    <img
      src="/logo.svg"
      alt="Elo Arc"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
      className={className}
    />
  );
}
