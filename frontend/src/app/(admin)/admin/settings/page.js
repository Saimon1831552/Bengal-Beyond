import SettingsForm from "@/components/admin/SettingsForm";
export default function Page() {
  return <SettingsForm title="General settings" intro="Booking rules." categories={["booking"]} />;
}