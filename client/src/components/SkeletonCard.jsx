export default function SkeletonCard({ height = 120, className = '' }) {
  return (
    <div className={`skeleton ${className}`} style={{ height, borderRadius: 16 }} />
  );
}

export function SkeletonText({ width = '100%', height = 16, className = '' }) {
  return (
    <div className={`skeleton ${className}`} style={{ width, height, borderRadius: 6, marginBottom: 8 }} />
  );
}
