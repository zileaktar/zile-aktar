import { getSiteSettings } from '@/lib/data/settings';
import { LogoSettingsForm } from '@/components/admin/LogoSettingsForm';
import { BankInfoForm } from '@/components/admin/BankInfoForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const { logoPath, bank } = await getSiteSettings();

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-primary">Site Ayarları</h1>
      <LogoSettingsForm currentLogoPath={logoPath} />
      <BankInfoForm bank={bank} />
    </div>
  );
}
