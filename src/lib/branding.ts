const RAW_LOGO_PATH = process.env.NEXT_PUBLIC_ORGANIZATION_LOGO_SVG_PATH?.trim() ?? '';
const RAW_SHOW_LOGO = (process.env.NEXT_PUBLIC_SHOW_LOGO ?? '').trim();

const isTruthyEnvValue = (value: string): boolean => /^(1|true|yes|on)$/i.test(value);

const normalizePublicAssetPath = (value: string): string => {
  if (!value) {
    return '';
  }

  return value.startsWith('/') ? value : `/${value}`;
};

export const organizationLogoSvgPath = normalizePublicAssetPath(RAW_LOGO_PATH);

export const shouldShowOrganizationLogo =
  isTruthyEnvValue(RAW_SHOW_LOGO) && organizationLogoSvgPath.length > 0;
