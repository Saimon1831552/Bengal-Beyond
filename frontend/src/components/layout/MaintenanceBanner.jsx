export default function MaintenanceBanner({ info }) {
  if (!info?.maintenance_mode) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[60] bg-terracotta px-4 py-2 text-center text-sm font-semibold text-white">
      {info.maintenance_message}
    </div>
  );
}
