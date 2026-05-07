import LegalLayout from '../components/LegalLayout';

const SECTIONS = [
  'data', 'use', 'sharing', 'security', 'rights', 'cookies', 'retention', 'dpo',
];

export default function Privacy() {
  return (
    <LegalLayout
      titleKey="privacy.title"
      introKey="privacy.intro"
      sectionsKey="privacy.sections"
      sectionOrder={SECTIONS}
    />
  );
}
