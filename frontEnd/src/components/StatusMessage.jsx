export default function StatusMessage({ status }) {
  if (!status?.message) return null;
  return <div className={`status-box show ${status.type}`}>{status.message}</div>;
}
