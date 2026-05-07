import LegalLayout from '../components/LegalLayout';

const SECTIONS = [
  'acceptance', 'service', 'account', 'plans', 'refund',
  'ip', 'liability', 'conduct', 'termination', 'law', 'contact',
];

export default function Terms() {
  return (
    <LegalLayout
      titleKey="terms.title"
      introKey="terms.intro"
      sectionsKey="terms.sections"
      sectionOrder={SECTIONS}
    />
  );
}
