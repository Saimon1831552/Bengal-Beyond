import SettingsForm from "@/components/admin/SettingsForm";

export default function Page() {
  return (
    <SettingsForm
      title="Website settings"
      intro="Site identity, public support contact details, and maintenance mode."
      categories={["general", "contact", "operations"]}
    />
  );
}